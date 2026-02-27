# Overleaf

Overleaf is a collaborative LaTeX editor. The cluster runs a self-hosted instance so students and faculty can write papers, reports, and documentation without relying on Overleaf's cloud service.

## Accessing Overleaf

```
https://overleaf.nstsdc.org
```

## Architecture

The Overleaf deployment consists of three components:

| Component | Type | Namespace | Purpose |
|---|---|---|---|
| overleaf | Deployment | overleaf | The Overleaf web application |
| mongo | StatefulSet | overleaf | MongoDB database (stores projects, users, documents) |
| redis | StatefulSet | overleaf | Redis cache (sessions, real-time collaboration) |

Both MongoDB and Redis use StatefulSets with persistent storage, so data survives pod restarts.

## Kubernetes resources

```bash
# Check all Overleaf components
kubectl -n overleaf get pods
kubectl -n overleaf get svc
kubectl -n overleaf get ingress
```

Services:

| Service | Port | Purpose |
|---|---|---|
| overleaf | 80 | Web UI |
| mongo | 27017 | MongoDB |
| redis | 6379 | Redis |

## Ingress

```bash
kubectl -n overleaf get ingress
```

The Ingress routes `overleaf.nstsdc.org` to the overleaf service on port 80, using Traefik.

## Data persistence

MongoDB and Redis both use PersistentVolumeClaims. This means:

- Overleaf projects, user accounts, and documents persist across pod restarts
- The data lives on the node's local disk (via K3s local-path-provisioner)

To check PVCs:

```bash
kubectl -n overleaf get pvc
```

## Administration

### Creating the first admin user

After initial deployment, you need to create an admin user. This is typically done through the Overleaf container:

```bash
kubectl -n overleaf exec -it <overleaf-pod> -- bash
# Inside the container, use Overleaf's admin creation command
```

### MongoDB access

If you need to inspect or repair the database:

```bash
kubectl -n overleaf exec -it mongo-0 -- mongosh
```

## Maintenance

### Restarting Overleaf

```bash
kubectl -n overleaf rollout restart deployment overleaf
```

This restarts the web application without touching the database.

### Checking logs

```bash
kubectl -n overleaf logs -l app=overleaf --tail=100
```
