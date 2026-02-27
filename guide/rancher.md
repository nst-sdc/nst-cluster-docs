# Rancher

Rancher is a web-based Kubernetes management platform. It provides a graphical UI for everything you can do with `kubectl`, plus user management, access control, and multi-cluster features.

## Why Rancher

`kubectl` is powerful but not visual. When you are managing a cluster with multiple namespaces, dozens of pods, and several students deploying apps, a dashboard helps. Rancher provides:

- Real-time view of nodes, pods, services, and ingresses
- Resource usage graphs
- One-click log viewing and shell access to pods
- User accounts with role-based access control
- Fleet integration for GitOps

## Accessing Rancher

```
https://rancher.nstsdc.org
```

Log in with:
- Username: `admin`
- Password: see the cluster admin

Rancher is also accessible at `rancher.dayshmookh.work` (the original domain from before the migration to nstsdc.org).

## How Rancher was installed

### Prerequisites

Rancher requires cert-manager for TLS certificate management (see [cert-manager & TLS](/guide/cert-manager)).

### Installation via Helm

```bash
kubectl create namespace cattle-system

helm repo add rancher-stable https://releases.rancher.com/server-charts/stable
helm repo update

helm install rancher rancher-stable/rancher \
  --namespace cattle-system \
  --set hostname=rancher.nstsdc.org \
  --set replicas=1
```

This deploys:
- The Rancher server pod
- A Rancher webhook
- A system-upgrade-controller
- Fleet (GitOps engine)
- CAPI (Cluster API) controllers
- Rancher Turtles (CAPI integration)

### Helm values

| Setting | Value | Why |
|---|---|---|
| `hostname` | `rancher.nstsdc.org` | The public URL Rancher listens on |
| `replicas` | `1` | Single replica is enough for a small cluster |

Current Helm release: Rancher v2.13.1 (chart version 2.13.1)

## Ingress and TLS

Rancher creates its own Ingress in the `cattle-system` namespace:

```bash
kubectl -n cattle-system get ingress rancher
```

The Ingress routes `rancher.nstsdc.org` to the Rancher service on port 80. Rancher handles TLS internally — it generates a self-signed CA and serves HTTPS on port 443.

### Cloudflare Tunnel rule

Because Rancher uses HTTPS with a self-signed certificate, the Cloudflare Tunnel needs a special rule:

```yaml
- hostname: "rancher.nstsdc.org"
  service: https://localhost:443
  originRequest:
    noTLSVerify: true
```

This tells cloudflared to connect to Rancher over HTTPS but skip TLS certificate verification (since the cert is self-signed). This rule must appear before the wildcard HTTP rule in the tunnel config.

## What Rancher deploys

When you install Rancher, it creates several namespaces and controllers:

| Namespace | Components |
|---|---|
| `cattle-system` | Rancher server, webhook, system-upgrade-controller |
| `cattle-fleet-system` | Fleet controller, gitjob, helmops |
| `cattle-fleet-local-system` | Fleet agent (for the local cluster) |
| `cattle-capi-system` | Cluster API controller |
| `cattle-turtles-system` | Rancher Turtles (CAPI integration) |

These are all managed by Rancher and generally should not be modified manually.

## Using Rancher

### Viewing workloads

Navigate to: Cluster > local > Workloads

You will see all deployments, StatefulSets, DaemonSets, and Jobs across all namespaces.

### Viewing logs

Click on any pod, then click "View Logs". This is equivalent to `kubectl logs <pod>`.

### Shell access

Click on any pod, then click "Execute Shell". This opens a terminal inside the container — equivalent to `kubectl exec -it <pod> -- sh`.

### Managing ingresses

Navigate to: Cluster > local > Service Discovery > Ingresses

This shows all Ingress rules, their hostnames, and which services they route to.

## Health notes

Some Rancher components may show high restart counts. This typically indicates resource pressure (Rancher is memory-hungry) or brief API server connectivity issues. As long as the pods are in `Running` state and the UI is accessible, the restarts are cosmetic.

```bash
# Check Rancher pod status and restarts
kubectl -n cattle-system get pods
kubectl -n cattle-fleet-system get pods
```
