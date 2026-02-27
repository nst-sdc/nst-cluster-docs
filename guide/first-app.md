# Deploying Your First App

This walkthrough deploys a simple web application to the cluster and makes it publicly accessible at a `*.nstsdc.org` URL.

## Prerequisites

- SSH access to nst-n1
- Basic familiarity with `kubectl`

## What we will deploy

`containous/whoami` — a tiny HTTP server that responds with information about itself (hostname, IP, headers). It is the standard test image for verifying ingress routing.

## Step 1: Create a namespace

Namespaces isolate workloads. Create one for your app:

```bash
kubectl create namespace apps
```

If the `apps` namespace already exists, this is fine — it will just tell you it already exists.

## Step 2: Create a Deployment

A Deployment manages your application pods — how many replicas to run, which image to use, and how to update them.

```bash
kubectl -n apps create deployment whoami --image=containous/whoami
```

Verify the pod is running:

```bash
kubectl -n apps get pods
```

You should see something like:

```
NAME                      READY   STATUS    RESTARTS   AGE
whoami-6b9f5d5897-abc12   1/1     Running   0          10s
```

## Step 3: Create a Service

A Service gives your deployment a stable internal address. Other things in the cluster (like Traefik) use the Service to reach your pods.

```bash
kubectl -n apps expose deployment whoami --port=80
```

Verify:

```bash
kubectl -n apps get svc whoami
```

## Step 4: Create an Ingress

The Ingress tells Traefik to route traffic for a specific hostname to your Service.

Create a file called `whoami-ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: whoami-ing
  namespace: apps
spec:
  ingressClassName: traefik
  rules:
    - host: whoami.nstsdc.org
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: whoami
                port:
                  number: 80
```

Apply it:

```bash
kubectl apply -f whoami-ingress.yaml
```

## Step 5: Test locally

Before testing from the internet, verify routing works on the node itself:

```bash
curl -i -H "Host: whoami.nstsdc.org" http://127.0.0.1
```

You should see a 200 response with details about the whoami container.

## Step 6: Test from the internet

Open your browser and visit:

```
http://whoami.nstsdc.org
```

The request travels: your browser → Cloudflare → tunnel → nst-n1 → Traefik → whoami Service → whoami Pod.

## What just happened

You created three Kubernetes resources:

1. **Deployment** — runs one or more copies of your container image
2. **Service** — provides a stable ClusterIP and DNS name for the deployment
3. **Ingress** — maps an external hostname to the Service

This is the fundamental pattern for every HTTP app on the cluster. The hostname, image, and port change; the pattern stays the same.

## Cleanup

To remove everything:

```bash
kubectl -n apps delete ingress whoami-ing
kubectl -n apps delete svc whoami
kubectl -n apps delete deployment whoami
```

## Next steps

- [Get a public URL for your own app](/guide/tutorial-public-url)
- [Debug a broken pod](/guide/tutorial-debugging)
