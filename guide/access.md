# Accessing the Cluster

There are several ways to interact with the cluster, depending on what you need to do.

## SSH (command-line access)

If you have SSH access configured, you can connect to the control plane node directly:

```bash
ssh nst-n1.nstsdc.org
```

This works from anywhere on the internet — the SSH connection goes through the Cloudflare Tunnel. You do not need to be on the campus network.

Under the hood, this uses `cloudflared` as a ProxyCommand. Your SSH config (typically `~/.ssh/config`) should include something like:

```
Host nst-n1.nstsdc.org
    ProxyCommand cloudflared access ssh --hostname %h
    User purple
```

If you do not have `cloudflared` installed locally, install it:

```bash
# macOS
brew install cloudflared

# Ubuntu/Debian
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install cloudflared
```

## kubectl (Kubernetes API)

Once you are SSH'd into nst-n1, `kubectl` is already configured and ready to use:

```bash
kubectl get nodes
kubectl get pods -A
```

The kubeconfig lives at `~/.kube/config` and points to the API server at `https://192.168.136.145:6443`.

If you want to use kubectl from your own machine (without SSH), you would need to copy the kubeconfig and set up a tunnel or port-forward to the API server. For most use cases, SSH-ing in and running kubectl there is simpler.

## Rancher (web UI)

Rancher provides a graphical interface for managing the cluster. Open in your browser:

```
https://rancher.nstsdc.org
```

From Rancher you can:
- View all nodes, namespaces, workloads, and services
- Create and manage deployments through the UI
- Monitor resource usage
- Manage user access

## NST Init (self-service deployment)

NST Init is a custom web app that simplifies deploying containerized applications:

```
https://init.nstsdc.org
```

Log in with your GitHub account. NST Init handles creating the Deployment, Service, and Ingress for you — you just provide the container image and a name.

## Running commands on all nodes

On nst-n1 there is a utility script called `allnodes` that runs a command on every node in the cluster:

```bash
allnodes "hostname; uptime"
allnodes "df -h / | tail -1"
allnodes "sudo systemctl is-active k3s-agent"
```

This is useful for checking health across the cluster without SSH-ing into each node individually.
