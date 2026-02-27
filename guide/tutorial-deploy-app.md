# Tutorial: Deploy a Web App

This tutorial walks through deploying your own web application to the cluster.

## What you need

- A containerized application (a Docker image, either public or pushed to a registry)
- SSH access to nst-n1, or access to NST Init

## Option A: Using NST Init (easiest)

1. Go to [init.nstsdc.org](https://init.nstsdc.org)
2. Log in with your GitHub account
3. Provide your app name and container image
4. NST Init creates the Deployment, Service, and Ingress for you
5. Your app is live at `<appname>.nstsdc.org`

## Option B: Using kubectl (manual)

This gives you full control over the configuration.

### Step 1: Choose a namespace

You can use the shared `apps` namespace or create your own:

```bash
kubectl create namespace myname
```

### Step 2: Create a Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: myname
spec:
  replicas: 1
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-app
          image: your-dockerhub-username/your-app:latest
          ports:
            - containerPort: 3000   # whatever port your app listens on
```

Apply it:

```bash
kubectl apply -f deployment.yaml
```

### Step 3: Create a Service

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app
  namespace: myname
spec:
  selector:
    app: my-app
  ports:
    - port: 80
      targetPort: 3000   # must match containerPort
```

```bash
kubectl apply -f service.yaml
```

### Step 4: Create an Ingress

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ing
  namespace: myname
spec:
  ingressClassName: traefik
  rules:
    - host: my-app.nstsdc.org
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app
                port:
                  number: 80
```

```bash
kubectl apply -f ingress.yaml
```

### Step 5: Verify

```bash
# Check pod is running
kubectl -n myname get pods

# Check service exists
kubectl -n myname get svc

# Check ingress is created
kubectl -n myname get ingress

# Test locally on the node
curl -i -H "Host: my-app.nstsdc.org" http://127.0.0.1

# Test from browser
# Visit: http://my-app.nstsdc.org
```

## Using a private container image

If your image is in a private registry (like GitHub Container Registry), you need to create an image pull secret:

```bash
kubectl -n myname create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_TOKEN
```

Then reference it in your Deployment:

```yaml
spec:
  template:
    spec:
      imagePullSecrets:
        - name: ghcr-secret
      containers:
        - name: my-app
          image: ghcr.io/your-org/your-app:latest
```

## Using the cluster's container registry

The cluster has a local container registry running at `nst-n1:30500`. You can push images directly:

```bash
# Tag your image
docker tag my-app:latest nst-n1.nstsdc.org:30500/my-app:latest

# Push
docker push nst-n1.nstsdc.org:30500/my-app:latest
```

Then use `nst-n1.nstsdc.org:30500/my-app:latest` as your image in the Deployment.

## Common mistakes

**Wrong targetPort:** The `targetPort` in the Service must match the port your app actually listens on inside the container. If your app runs on port 3000, set `targetPort: 3000`.

**Image pull errors:** If the pod shows `ImagePullBackOff`, the image name is wrong, the registry is unreachable, or authentication is missing for a private image.

**Pod CrashLoopBackOff:** Your application is crashing. Check the logs:
```bash
kubectl -n myname logs <pod-name>
```

**Ingress returns 404:** Either the Ingress hostname does not match what you are requesting, or the Ingress is in a different namespace than the Service.
