# Minecraft Server

Yes, there is a Minecraft server running on the Kubernetes cluster. It was set up as a practical exercise in deploying stateful applications and also because it is fun.

## Connecting

Open Minecraft Java Edition and add a server:

```
Server Address: california-utter.gl.joinmc.link
Port: 25565 (default)
Edition: Java
```

## Architecture

Minecraft presents interesting infrastructure challenges that make it a good teaching exercise:

| Challenge | Solution |
|---|---|
| Game state must persist | StatefulSet with PersistentVolumeClaim |
| Raw TCP protocol (not HTTP) | Cannot use Traefik/Ingress — uses NodePort instead |
| No static public IP | Playit.gg game tunnel (Cloudflare Tunnel does not support arbitrary TCP) |
| Resource-intensive | Runs on dedicated resources within the cluster |

### Components

| Resource | Type | Namespace |
|---|---|---|
| minecraft | StatefulSet | minecraft |
| minecraft | Service (NodePort) | minecraft |
| playit | systemd service on nst-n1 | — |

The Minecraft server image is `itzg/minecraft-server` with `TYPE=PAPER` (Paper is a high-performance Bukkit-compatible server).

## Why StatefulSet, not Deployment

A Deployment is designed for stateless applications — pods can be created and destroyed freely. Minecraft is stateful: it has a world that must persist. A StatefulSet provides:

- Stable pod identity (`minecraft-0`)
- Persistent storage that survives pod restarts
- Ordered startup and shutdown

## Why Playit.gg, not Cloudflare Tunnel

Cloudflare Tunnel routes HTTP and HTTPS traffic. Minecraft uses raw TCP on port 25565. Cloudflare does support TCP tunneling through `cloudflared`, but not for arbitrary public TCP services on the free plan.

Playit.gg is a free game tunnel service that:
1. Assigns a public address
2. Forwards TCP traffic to a specified local port
3. Runs as a systemd service on nst-n1

The tunnel target is the Minecraft NodePort on nst-n1 (port 32565).

## Starting the server

On nst-n1:

```bash
# Start the Minecraft pod
kubectl -n minecraft scale statefulset minecraft --replicas=1

# Wait for it to be ready
kubectl -n minecraft get pods -w

# Start the game tunnel
sudo systemctl start playit

# Verify the tunnel is running
sudo systemctl status playit --no-pager

# Verify the port is reachable
nc -vz 127.0.0.1 32565
```

## Stopping the server

```bash
# Stop the Minecraft pod (world data is preserved in PVC)
kubectl -n minecraft scale statefulset minecraft --replicas=0

# Stop the tunnel
sudo systemctl stop playit
```

The PersistentVolumeClaim remains intact. No data is lost.

## Checking status

```bash
# Is the pod running?
kubectl -n minecraft get pods

# Is the tunnel running?
sudo systemctl status playit --no-pager

# Is the port accessible?
nc -vz 127.0.0.1 32565

# Server logs
kubectl -n minecraft logs minecraft-0 --tail=50
```

## What stays running when Minecraft is off

These are platform services and should not be stopped:
- k3s
- containerd
- cloudflared
- Traefik
- Rancher

Stopping Minecraft only affects the `minecraft` namespace and the `playit` systemd service.
