# K3s Installation

K3s is a lightweight, certified Kubernetes distribution designed for resource-constrained environments. It bundles the API server, scheduler, controller manager, Traefik, CoreDNS, and a storage provisioner into a single binary.

## Why K3s over standard Kubernetes

- **Single binary** — no need to install etcd, kubelet, kube-proxy, and CNI separately
- **Low resource usage** — runs comfortably on machines with 4-8 GB RAM
- **Batteries included** — comes with Traefik (ingress), CoreDNS (DNS), local-path-provisioner (storage), and ServiceLB (load balancer emulation)
- **Fast setup** — a one-liner installs and starts the cluster

For a campus cluster with 8 GB worker nodes, K3s is a better fit than full kubeadm-based Kubernetes.

## Installing the control plane

On nst-n1, the entire installation was a single command:

```bash
curl -sfL https://get.k3s.io | sh -
```

This:
1. Downloads and installs the K3s binary
2. Creates a systemd service (`k3s.service`)
3. Starts the K3s server (control plane + single-node cluster)
4. Deploys Traefik, CoreDNS, metrics-server, and local-path-provisioner automatically
5. Generates a kubeconfig at `/etc/rancher/k3s/k3s.yaml`

After installation, verify:

```bash
sudo k3s kubectl get nodes
```

## kubectl access

K3s stores its kubeconfig at `/etc/rancher/k3s/k3s.yaml`, owned by root. To use `kubectl` without sudo:

```bash
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
chmod 600 ~/.kube/config
```

Then test:

```bash
kubectl get nodes
kubectl get pods -A
```

## Important: API server address

The generated kubeconfig sets the API server to `https://127.0.0.1:6443`. This works on the control plane itself, but worker nodes need to reach the API server at the control plane's actual IP.

Edit the kubeconfig and change:

```yaml
# Before
server: https://127.0.0.1:6443

# After
server: https://192.168.136.145:6443
```

This is critical. If the server address is `127.0.0.1`, workers will try to connect to their own localhost and fail to join the cluster.

## K3s service management

```bash
# Check status
sudo systemctl status k3s

# Restart
sudo systemctl restart k3s

# View logs
sudo journalctl -u k3s -f

# K3s version
k3s --version
```

## What gets installed automatically

After K3s starts, these system pods appear:

| Pod | Namespace | Purpose |
|---|---|---|
| traefik | kube-system | Ingress controller |
| coredns | kube-system | Cluster DNS |
| metrics-server | kube-system | Resource metrics collection |
| local-path-provisioner | kube-system | Dynamic PV provisioning using local disk |
| svclb-traefik (per node) | kube-system | LoadBalancer emulation |

You can verify them with:

```bash
kubectl get pods -n kube-system
```

## K3s data directory

K3s stores its data at `/var/lib/rancher/k3s/`. This includes:
- Server manifests (auto-deployed by K3s): `/var/lib/rancher/k3s/server/manifests/`
- Embedded etcd data
- Container images and layers

The auto-deploy manifests directory is how K3s installs Traefik — it drops a HelmChart resource there, and K3s picks it up automatically.

## Uninstalling K3s

If you ever need to completely remove K3s from a node:

```bash
# On a server (control plane)
/usr/local/bin/k3s-uninstall.sh

# On an agent (worker)
/usr/local/bin/k3s-agent-uninstall.sh
```

This removes the binary, systemd service, and all K3s data. Use with caution.
