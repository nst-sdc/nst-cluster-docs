# Helm Releases

Helm is the package manager for Kubernetes. These are the Helm releases currently installed on the cluster.

## Installed releases

| Release | Namespace | Chart | App Version | Installed |
|---|---|---|---|---|
| traefik | kube-system | traefik-37.1.1 | v3.5.1 | 2025-12-25 |
| traefik-crd | kube-system | traefik-crd-37.1.1 | v3.5.1 | 2025-12-25 |
| cert-manager | cert-manager | cert-manager-v1.19.2 | v1.19.2 | 2025-12-31 |
| rancher | cattle-system | rancher-2.13.1 | v2.13.1 | 2025-12-31 |
| rancher-webhook | cattle-system | rancher-webhook-108.0.1 | 0.9.1 | 2025-12-31 |
| fleet | cattle-fleet-system | fleet-108.0.1 | 0.14.1 | 2025-12-31 |
| fleet-crd | cattle-fleet-system | fleet-crd-108.0.1 | 0.14.1 | 2025-12-31 |
| fleet-agent-local | cattle-fleet-local-system | fleet-agent-local | — | 2025-12-31 |
| rancher-turtles | cattle-turtles-system | rancher-turtles-108.0.1 | 0.25.1 | 2025-12-31 |
| system-upgrade-controller | cattle-system | system-upgrade-controller-108.0.0 | v0.17.0 | 2025-12-31 |

JupyterHub is also installed via Helm but may not appear in `helm list` if it was installed with a different kubeconfig context.

## Useful Helm commands

```bash
# List all releases across all namespaces
helm list -A

# View details of a specific release
helm status <release-name> -n <namespace>

# View the values used for a release
helm get values <release-name> -n <namespace>

# View all values (including defaults)
helm get values <release-name> -n <namespace> --all

# View release history
helm history <release-name> -n <namespace>

# Upgrade a release
helm upgrade <release-name> <chart> -n <namespace> -f values.yaml

# Rollback to a previous revision
helm rollback <release-name> <revision> -n <namespace>
```

## Helm repositories

```bash
# List configured repos
helm repo list

# Update repos
helm repo update

# Search for charts
helm search repo <keyword>
```

Currently configured repositories:

| Repository | URL |
|---|---|
| jetstack | https://charts.jetstack.io |
| rancher-stable | https://releases.rancher.com/server-charts/stable |
| jupyterhub | https://jupyterhub.github.io/helm-chart/ |

## Notes

- Traefik and its CRDs are managed by K3s through auto-deploy manifests, not through manual Helm commands. Upgrading Traefik should be done by updating K3s, not by running `helm upgrade` directly.
- Rancher manages several sub-charts (fleet, webhook, turtles, system-upgrade-controller). These are installed and upgraded by Rancher automatically. Do not modify them independently.
