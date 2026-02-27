# Multi-Node Setup

After the single-node cluster was running on nst-n1, the next step was adding four worker nodes to distribute workloads.

## Joining a worker to the cluster

Each worker needs two things to join:
1. The control plane's IP address
2. A join token

### Get the join token

On nst-n1 (the control plane):

```bash
sudo cat /var/lib/rancher/k3s/server/node-token
```

This prints a long token string. Copy it — you will need it on each worker.

### Install K3s agent on a worker

On each worker node (nst-n2 through nst-n5):

```bash
curl -sfL https://get.k3s.io | K3S_URL=https://192.168.136.145:6443 K3S_TOKEN=<TOKEN> sh -
```

Replace `<TOKEN>` with the token from the previous step.

This installs K3s in agent mode (worker only — no control plane components) and registers the node with the cluster.

### Verify

Back on nst-n1:

```bash
kubectl get nodes -o wide
```

You should see all five nodes listed. New nodes start as `Ready` within a few seconds.

## What the agent runs

Worker nodes run a minimal set of components:

| Component | Purpose |
|---|---|
| kubelet | Manages pods on the node |
| kube-proxy | Network rules for service routing |
| containerd | Container runtime |
| svclb-traefik | LoadBalancer emulation pod |

They do not run the API server, scheduler, or controller manager — those stay on the control plane.

## Agent configuration

The K3s agent service file is at:

```
/etc/systemd/system/k3s-agent.service
```

Environment variables (including the join token and server URL) may be in:

```
/etc/systemd/system/k3s-agent.service.env
```

If you need to change the server URL or token:

```bash
sudo nano /etc/systemd/system/k3s-agent.service.env
sudo systemctl restart k3s-agent
```

## Labeling nodes

After all nodes are joined, label them for scheduling:

```bash
kubectl label node nst-n1 role=control --overwrite
kubectl label node nst-n2 role=compute --overwrite
kubectl label node nst-n3 role=compute --overwrite
kubectl label node nst-n4 role=compute --overwrite
kubectl label node nst-n5 role=compute --overwrite
```

These labels are used by workloads like JupyterHub to schedule pods only on worker nodes.

## The allnodes utility

Managing five nodes by SSH-ing into each one is tedious. A helper script called `allnodes` was created on nst-n1 at `~/bin/allnodes`. It runs a given command on all nodes in sequence.

Usage:

```bash
allnodes "hostname; uptime"
allnodes "df -h / | tail -1"
allnodes "sudo systemctl is-active k3s-agent"
```

To make it available in your shell, add to `~/.zshrc.local`:

```bash
export PATH="$HOME/bin:$PATH"
```

## Common issues

### Node shows NotReady

Most likely causes:
1. The machine is physically powered off
2. The k3s-agent service crashed or was stopped
3. Network connectivity between the node and control plane was lost

Check in order:
```bash
# Is the machine reachable?
ping 192.168.136.146

# Is the agent running?
ssh nst-n2 "sudo systemctl status k3s-agent"

# What do the agent logs say?
ssh nst-n2 "sudo journalctl -u k3s-agent --no-pager -n 50"
```

### kubeadm conflicts

If a node previously had kubeadm installed, port 6443 may be in use and K3s will fail. Make sure kubeadm and its components are completely removed before installing K3s.

### API server address

The kubeconfig on nst-n1 must use the actual IP (`192.168.136.145`), not `127.0.0.1`. If workers cannot reach the API server, this is the first thing to check:

```bash
kubectl config view --minify | grep server
```
