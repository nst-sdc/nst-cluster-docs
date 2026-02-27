# Services Overview

The cluster runs several platform services for students and faculty. Each service has its own namespace and is accessible via a `*.nstsdc.org` subdomain.

## Platform services

| Service | URL | Purpose |
|---|---|---|
| NST Init | [init.nstsdc.org](https://init.nstsdc.org) | Self-service app deployment portal |
| JupyterHub | [notebooks.nstsdc.org](https://notebooks.nstsdc.org) | Python/data science notebook environment |
| Overleaf | [overleaf.nstsdc.org](https://overleaf.nstsdc.org) | Collaborative LaTeX editor |
| Rancher | [rancher.nstsdc.org](https://rancher.nstsdc.org) | Cluster management dashboard |
| Container Registry | `nst-n1:30500` | Private Docker image registry |

## Student applications

Students deploy their own apps to the cluster. Each gets a namespace and a public URL. Current student deployments include portfolios, voice assistants, games, and APIs.

```bash
# See all ingress rules (i.e., all public URLs)
kubectl get ingress -A
```

## Fun stuff

| Service | Access |
|---|---|
| Minecraft | `california-utter.gl.joinmc.link:25565` (Java Edition) |
