# Network Configuration

## Subnet and addressing

All nodes are on the same local network:

| Property | Value |
|---|---|
| Subnet | 192.168.136.0/20 |
| Gateway | 192.168.128.1 |
| Node IP range | 192.168.136.145 – 192.168.136.149 |
| Kubernetes API | 192.168.136.145:6443 |
| Pod CIDR | 10.42.0.0/16 (K3s default) |
| Service CIDR | 10.43.0.0/16 (K3s default) |

## Static IP configuration with Netplan

Each node has a static IP configured via Netplan. The configuration files live at `/etc/netplan/` on each machine.

### Example: nst-n1 (192.168.136.145)

```yaml
network:
  ethernets:
    enp2s0:
      dhcp4: true
      addresses: [192.168.136.145/20]
      routes:
        - to: default
          via: 192.168.128.1
      dhcp6: true
      match:
        macaddress: 8c:ec:4b:79:52:81
      set-name: enp2s0
  version: 2
```

### Example: nst-n2 (192.168.136.146)

```yaml
network:
  ethernets:
    enp2s0:
      addresses:
        - 192.168.136.146/20
      routes:
        - to: default
          via: 192.168.128.1
      match:
        macaddress: f4:8e:38:82:d2:25
      nameservers:
        addresses: []
        search: []
      set-name: enp2s0
  version: 2
```

### Key points

- The `match: macaddress` field ties the config to a specific network interface, regardless of what the kernel names it.
- `set-name: enp2s0` gives the interface a predictable name.
- Some nodes have `dhcp4: true` alongside the static address — this means the node gets both a DHCP lease and the static address. The static address is what matters for cluster communication.

### Applying Netplan changes

After editing a Netplan file:

```bash
sudo netplan apply
```

Be careful with this if you are connected via SSH — a misconfiguration will disconnect you.

### Tutorial: Setting up a static IP on a new node

If you are adding a new machine to the cluster:

1. Find the MAC address of the network interface:
   ```bash
   ip link show
   ```

2. Create or edit the Netplan config:
   ```bash
   sudo nano /etc/netplan/01-netcfg.yaml
   ```

3. Use this template (replace values):
   ```yaml
   network:
     ethernets:
       enp2s0:
         addresses:
           - 192.168.136.NEW_IP/20
         routes:
           - to: default
             via: 192.168.128.1
         match:
           macaddress: YOUR:MAC:ADDRESS
         nameservers:
           addresses: [8.8.8.8, 8.8.4.4]
         set-name: enp2s0
     version: 2
   ```

4. Apply:
   ```bash
   sudo netplan apply
   ```

5. Verify:
   ```bash
   ip addr show enp2s0
   ping 192.168.128.1   # gateway
   ping 8.8.8.8         # internet
   ```

## Internal Kubernetes networking

Within the cluster, Kubernetes manages its own overlay network:

- **Pods** get IPs from the `10.42.0.0/16` range. These IPs are internal and not reachable from outside the cluster.
- **Services** get IPs from the `10.43.0.0/16` range. These are virtual IPs that load-balance across pods.
- **DNS** is handled by CoreDNS. A service named `my-svc` in namespace `my-ns` is reachable at `my-svc.my-ns.svc.cluster.local` from any pod in the cluster.

You almost never need to think about pod or service IPs directly. Use DNS names or Ingress hostnames instead.

## Verifying network state

```bash
# Check node IPs
kubectl get nodes -o wide

# Check what is listening on a node
sudo ss -tulpn

# Check Traefik's external IPs
kubectl -n kube-system get svc traefik

# Test HTTP routing locally (on nst-n1)
curl -i -H "Host: whoami.nstsdc.org" http://127.0.0.1
```
