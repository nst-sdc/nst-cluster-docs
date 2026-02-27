# Tutorial: Debug a Broken Pod

Your app is deployed but something is wrong. This tutorial walks through the standard debugging process for Kubernetes pods.

## Step 1: Check pod status

```bash
kubectl -n your-namespace get pods
```

Common statuses and what they mean:

| Status | Meaning |
|---|---|
| Running | Pod is alive and (presumably) healthy |
| Pending | Pod cannot be scheduled — usually resource constraints or node selector issues |
| CrashLoopBackOff | Your app keeps crashing and Kubernetes keeps restarting it |
| ImagePullBackOff | Cannot pull the container image |
| ErrImagePull | Same as above — image name is wrong, registry is unreachable, or auth is missing |
| Terminating | Pod is being deleted (stuck Terminating means something is blocking shutdown) |
| ContainerCreating | Pod is starting — if it stays here, something is wrong with the container setup |

## Step 2: Check pod events

```bash
kubectl -n your-namespace describe pod <pod-name>
```

Scroll to the `Events` section at the bottom. This tells you what Kubernetes tried to do and where it failed. Common events:

- `FailedScheduling` — no node has enough resources, or the node selector does not match
- `Failed to pull image` — wrong image name or missing auth
- `Back-off restarting failed container` — your app crashed (check logs)
- `Liveness probe failed` — health check is failing

## Step 3: Check logs

```bash
kubectl -n your-namespace logs <pod-name>
```

If the pod has crashed and restarted, check the previous container's logs:

```bash
kubectl -n your-namespace logs <pod-name> --previous
```

This is usually where you find the actual error — a missing environment variable, a database connection failure, a port binding issue, etc.

## Step 4: Get a shell inside the container

If the pod is running but misbehaving:

```bash
kubectl -n your-namespace exec -it <pod-name> -- sh
```

Or if `sh` is not available:

```bash
kubectl -n your-namespace exec -it <pod-name> -- /bin/bash
```

From inside the container, you can:
- Check if your app is listening: `netstat -tlnp` or `ss -tlnp`
- Test internal connectivity: `curl http://localhost:3000`
- Check environment variables: `env | sort`
- Look at files: `ls`, `cat`, etc.

## Step 5: Check the service

```bash
kubectl -n your-namespace get svc
kubectl -n your-namespace describe svc <service-name>
```

Make sure:
- The `selector` matches the labels on your pod
- The `targetPort` matches the port your app listens on
- Endpoints are populated (not empty):

```bash
kubectl -n your-namespace get endpoints <service-name>
```

If endpoints are empty, the selector does not match any running pods.

## Step 6: Check the ingress

```bash
kubectl -n your-namespace get ingress
kubectl -n your-namespace describe ingress <ingress-name>
```

Make sure:
- The `host` matches the URL you are testing
- The `backend` service and port are correct
- The ingress is in the same namespace as the service

## Common scenarios

### App crashes immediately

Check logs. Common causes:
- Missing environment variable
- Cannot connect to database
- Port already in use (unlikely in Kubernetes)
- Application bug

### App works locally but not on cluster

- Make sure the `containerPort` in the Deployment matches what your app listens on
- Make sure the Service `targetPort` matches the `containerPort`
- Make sure the app binds to `0.0.0.0`, not `127.0.0.1` (many frameworks default to localhost)

### Ingress returns 404

- The hostname in the Ingress does not match the request
- The Ingress is in a different namespace than the Service
- Typo in the hostname

### Ingress returns 503

- The backend service exists but has no ready endpoints
- The pods are crashing (check pod status and logs)

### Pod stuck in Pending

```bash
kubectl -n your-namespace describe pod <pod-name>
```

Look for `FailedScheduling` events. Common causes:
- Not enough CPU or memory on available nodes
- `nodeSelector` does not match any node's labels
- All nodes are `NotReady`

### Pod stuck in Terminating

Force delete (use with caution):

```bash
kubectl -n your-namespace delete pod <pod-name> --force --grace-period=0
```

## The debugging flowchart

```
App not working
  |
  ├── Pod not Running? → describe pod → check Events
  │     ├── Pending → FailedScheduling → check resources / nodeSelector
  │     ├── ImagePullBackOff → wrong image name or missing auth
  │     └── CrashLoopBackOff → check logs (and --previous)
  |
  ├── Pod Running but app broken? → check logs → exec into pod
  |
  ├── Service not routing? → check endpoints → verify selector matches labels
  |
  └── Ingress returning errors?
        ├── 404 → hostname mismatch or missing ingress
        └── 503 → backend has no ready endpoints
```
