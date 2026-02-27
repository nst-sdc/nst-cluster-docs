# Architecture

## The big picture

```
Internet
   |
Cloudflare (DNS + Edge)
   |
Cloudflare Tunnel (encrypted)
   |
nst-n1 (cloudflared daemon)
   |
   ├── :22  → SSH
   ├── :80  → Traefik → Ingress rules → Services → Pods
   ├── :443 → Traefik → Rancher (TLS)
   |
   └── Playit.gg tunnel → :32565 → Minecraft (raw TCP)
```

All public traffic enters through a single Cloudflare Tunnel running on `nst-n1`. This means the cluster needs no static public IP and no router port-forwarding. Cloudflare handles DNS, DDoS protection, and edge caching. The tunnel connects to `cloudflared` on nst-n1, which forwards traffic to the local Traefik ingress controller.

Traefik examines the `Host` header of each HTTP request and routes it to the correct Kubernetes service based on Ingress rules.

For non-HTTP protocols (like Minecraft's raw TCP), a separate game tunnel service (Playit.gg) is used, since Cloudflare Tunnel does not support arbitrary public TCP.

## Nodes

The cluster has five physical machines on the campus network.

| Node | Role | IP | RAM | Kernel |
|---|---|---|---|---|
| nst-n1 | Control Plane | 192.168.136.145 | 16 GB | 6.17.0-12-generic |
| nst-n2 | Worker | 192.168.136.146 | 8 GB | 6.17.0-8-generic |
| nst-n3 | Worker | 192.168.136.147 | 8 GB | 6.17.0-8-generic |
| nst-n4 | Worker | 192.168.136.148 | 8 GB | 6.17.0-8-generic |
| nst-n5 | Worker | 192.168.136.149 | 8 GB | 6.17.0-14-generic |

Total cluster memory: approximately 48 GB.

All nodes run Ubuntu Server 25.10 with static IPs on the 192.168.136.0/20 subnet (gateway: 192.168.128.1).

## Kubernetes components

K3s is a lightweight, production-grade Kubernetes distribution. It bundles several components that would normally require separate installation:

| Component | What it does |
|---|---|
| K3s API server | The Kubernetes control plane (runs on nst-n1) |
| etcd (embedded) | Cluster state storage |
| Traefik | Ingress controller — routes external HTTP to internal services |
| CoreDNS | Internal DNS for service discovery |
| metrics-server | Collects resource usage data from nodes and pods |
| local-path-provisioner | Creates PersistentVolumes using local disk storage |
| ServiceLB (svclb) | Emulates cloud LoadBalancer using DaemonSet pods on each node |

## How traffic flows

When someone visits `whoami.nstsdc.org`:

1. DNS resolves `whoami.nstsdc.org` to a Cloudflare CNAME (pointing to the tunnel)
2. Cloudflare forwards the request through the tunnel to `nst-n1:80`
3. `cloudflared` on nst-n1 passes it to `localhost:80`
4. Traefik receives it, checks the `Host: whoami.nstsdc.org` header
5. Traefik finds a matching Ingress rule in the `apps` namespace
6. The request is forwarded to the `whoami` Service
7. The Service routes to one of the `whoami` Pods
8. The Pod responds, and the response travels back the same path

This is the same pattern for every HTTP app on the cluster. The only things that change per app are the hostname, the Ingress rule, and the backing Service/Pod.

## Node roles

**Control plane (nst-n1):**
- Runs the Kubernetes API server, scheduler, and controller manager
- Hosts `cloudflared` (the only node with public tunnel access)
- Runs Rancher, cert-manager, Fleet, and other platform services
- Labeled `role=control`

**Workers (nst-n2 through nst-n5):**
- Run student workloads (app pods, Jupyter notebook servers)
- Labeled `role=compute`
- JupyterHub is configured to schedule user pods only on these nodes

## Domain and DNS

The cluster uses the domain `nstsdc.org`, managed through Cloudflare. All subdomains point to the Cloudflare Tunnel via CNAME records.

Current subdomain pattern:
- `*.nstsdc.org` — wildcard route to Traefik (HTTP apps)
- `nst-n1.nstsdc.org` — SSH access
- `rancher.nstsdc.org` — Rancher UI (HTTPS, special tunnel rule)

When you deploy an app and create an Ingress with host `myapp.nstsdc.org`, it automatically becomes publicly accessible — no DNS configuration needed, because the wildcard CNAME already covers it.
