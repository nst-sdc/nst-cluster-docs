# Node Inventory

## Overview

The cluster consists of five physical machines. All are located on campus and connected to the same local network.

| Node | Role | IP Address | MAC Address | RAM | Disk | OS |
|---|---|---|---|---|---|---|
| nst-n1 | Control Plane | 192.168.136.145 | 8c:ec:4b:79:52:81 | 16 GB | 233 GB NVMe | Ubuntu 25.10 |
| nst-n2 | Worker | 192.168.136.146 | f4:8e:38:82:d2:25 | 8 GB | — | Ubuntu 25.10 |
| nst-n3 | Worker | 192.168.136.147 | — | 8 GB | — | Ubuntu 25.10 |
| nst-n4 | Worker | 192.168.136.148 | — | 8 GB | — | Ubuntu 25.10 |
| nst-n5 | Worker | 192.168.136.149 | — | 8 GB | — | Ubuntu 25.10 |

## Kubernetes versions

All nodes run K3s v1.33.6+k3s1 with containerd 2.1.5.

## Node labels

Labels are used to control where workloads are scheduled:

```bash
kubectl get nodes --show-labels
```

| Node | Label | Purpose |
|---|---|---|
| nst-n1 | `role=control` | Runs platform services only (Rancher, cert-manager, etc.) |
| nst-n2 | `role=compute` | Runs student workloads |
| nst-n3 | `role=compute` | Runs student workloads |
| nst-n4 | `role=compute` | Runs student workloads |
| nst-n5 | `role=compute` | Runs student workloads |

JupyterHub, for example, uses a `nodeSelector` to place notebook servers only on nodes labeled `role=compute`.

## How labels were applied

```bash
kubectl label node nst-n1 role=control --overwrite
kubectl label node nst-n2 role=compute --overwrite
kubectl label node nst-n3 role=compute --overwrite
kubectl label node nst-n4 role=compute --overwrite
kubectl label node nst-n5 role=compute --overwrite
```

## Control plane vs workers

The **control plane** (nst-n1) runs the Kubernetes API server, scheduler, and controller manager. It also runs:
- `cloudflared` — the Cloudflare Tunnel daemon
- Rancher — cluster management UI
- cert-manager — TLS certificate automation
- Fleet — GitOps engine
- Traefik — ingress controller

The **workers** (nst-n2 through nst-n5) run user workloads: student app deployments, Jupyter notebook servers, and other application pods. They do not have direct public access — all traffic reaches them through Traefik on nst-n1.

## Physical location

All machines are in the campus server room. They are powered on and connected to the campus LAN. If a node goes `NotReady`, the most common cause is that someone physically turned it off or it lost network connectivity. Check the physical machine before debugging Kubernetes.

## Checking node health

```bash
# See all nodes with their status, IPs, and OS info
kubectl get nodes -o wide

# Check resource usage per node
kubectl top nodes

# Run a command on all nodes
allnodes "hostname; uptime; free -h | head -2"
```
