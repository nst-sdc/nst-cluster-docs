# Container Registry

The cluster runs a private container registry, allowing students to push Docker images directly to the cluster instead of going through Docker Hub or GitHub Container Registry.

## Access

The registry is available as a NodePort service:

```
nst-n1:30500
```

It is in the `exekute` namespace.

## Pushing images

From a machine with Docker installed and network access to nst-n1:

```bash
# Tag your image for the cluster registry
docker tag my-app:latest 192.168.136.145:30500/my-app:latest

# Push
docker push 192.168.136.145:30500/my-app:latest
```

Then reference it in your Kubernetes Deployment:

```yaml
spec:
  containers:
    - name: my-app
      image: 192.168.136.145:30500/my-app:latest
```

## Why a local registry

- Faster image pulls (images are already on the local network)
- No rate limits (Docker Hub has pull rate limits)
- No authentication needed for pulling within the cluster
- Students can push images without needing a Docker Hub or GHCR account

## Configuration

```bash
# Check registry status
kubectl -n exekute get pods
kubectl -n exekute get svc registry
```

The service exposes port 5000 internally, mapped to NodePort 30500.

## Insecure registry

The registry runs without TLS. If Docker on your machine refuses to push (complaining about HTTPS), you need to configure it as an insecure registry.

On your machine, add to Docker's daemon configuration (`/etc/docker/daemon.json` on Linux, or Docker Desktop settings on macOS):

```json
{
  "insecure-registries": ["192.168.136.145:30500"]
}
```

Restart Docker after this change.

## Listing images

The registry exposes a basic API:

```bash
# List all repositories
curl http://192.168.136.145:30500/v2/_catalog

# List tags for an image
curl http://192.168.136.145:30500/v2/my-app/tags/list
```
