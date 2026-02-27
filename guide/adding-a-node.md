# Adding a Node

This guide walks through adding a new physical machine to the cluster as a worker node.

## Prerequisites

- A machine with Ubuntu Server installed
- Network connectivity to the campus LAN
- An available static IP in the 192.168.136.x range
- SSH access to the new machine and to nst-n1

## Step 1: Install Ubuntu Server

Install Ubuntu Server on the new machine. During installation:

- Choose a hostname following the pattern: `nst-n6`, `nst-n7`, etc.
- Set the default boot target to `multi-user.target` (no GUI)
- Create a user account

## Step 2: Configure static IP

Find the network interface and MAC address:

```bash
ip link show
```

Create a Netplan configuration:

```bash
sudo nano /etc/netplan/01-netcfg.yaml
```

```yaml
network:
  ethernets:
    enp2s0:
      addresses:
        - 192.168.136.150/20    # use the next available IP
      routes:
        - to: default
          via: 192.168.128.1
      match:
        macaddress: XX:XX:XX:XX:XX:XX   # your machine's MAC
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
      set-name: enp2s0
  version: 2
```

Apply:

```bash
sudo netplan apply
```

Verify connectivity:

```bash
ping 192.168.136.145   # should reach nst-n1
ping 8.8.8.8           # should reach the internet
```

## Step 3: Set the hostname

```bash
sudo hostnamectl set-hostname nst-n6
```

Edit `/etc/hosts` to include the new hostname:

```bash
echo "192.168.136.150 nst-n6" | sudo tee -a /etc/hosts
```

## Step 4: Get the join token

On nst-n1:

```bash
sudo cat /var/lib/rancher/k3s/server/node-token
```

Copy the token.

## Step 5: Install K3s agent

On the new node:

```bash
curl -sfL https://get.k3s.io | K3S_URL=https://192.168.136.145:6443 K3S_TOKEN=<TOKEN> sh -
```

This installs K3s in agent (worker) mode and joins the cluster.

## Step 6: Verify the node joined

On nst-n1:

```bash
kubectl get nodes -o wide
```

The new node should appear as `Ready` within a minute.

## Step 7: Label the node

```bash
kubectl label node nst-n6 role=compute --overwrite
```

This allows JupyterHub and other workloads with `nodeSelector: { role: compute }` to schedule pods on this node.

## Step 8: Verify workloads can schedule

Check that system pods (like svclb-traefik) are running on the new node:

```bash
kubectl get pods -A -o wide | grep nst-n6
```

You should see at least `svclb-traefik` pods.

## Step 9: Update documentation

Add the new node to:
- The node inventory in these docs
- Any monitoring or alerting configurations
- The `allnodes` script if it uses a hardcoded node list

## Post-setup checklist

- [ ] Static IP configured and tested
- [ ] Hostname set
- [ ] K3s agent installed and joined
- [ ] Node shows `Ready` in kubectl
- [ ] Node labeled `role=compute`
- [ ] svclb-traefik pod running on the node
- [ ] Documentation updated
