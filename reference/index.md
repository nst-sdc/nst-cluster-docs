# Cheat Sheet

Quick reference commands for common cluster operations. Run these on nst-n1 unless noted otherwise.

## Cluster health

```bash
# Node status
kubectl get nodes -o wide

# All pods across all namespaces
kubectl get pods -A

# Resource usage per node
kubectl top nodes

# Resource usage per pod
kubectl top pods -A
```

## SSH and access

```bash
# SSH into the control plane (from your laptop)
ssh nst-n1.nstsdc.org

# Run a command on all nodes
allnodes "hostname; uptime"
allnodes "df -h / | tail -1"
allnodes "free -h | head -2"
```

## Cloudflare Tunnel

```bash
# Status
sudo systemctl status cloudflared

# Logs (live)
sudo journalctl -u cloudflared -f

# Restart (will break current SSH session)
sudo systemctl restart cloudflared

# Edit config
sudo nano /etc/cloudflared/config.yml

# Verify DNS
dig whoami.nstsdc.org +short
```

## Working with pods

```bash
# List pods in a namespace
kubectl -n apps get pods

# View pod logs
kubectl -n apps logs <pod-name>

# View previous container's logs (after crash)
kubectl -n apps logs <pod-name> --previous

# Get a shell inside a pod
kubectl -n apps exec -it <pod-name> -- sh

# Describe a pod (events, scheduling, status)
kubectl -n apps describe pod <pod-name>
```

## Deployments

```bash
# Create a deployment
kubectl -n apps create deployment myapp --image=nginx

# Scale a deployment
kubectl -n apps scale deployment myapp --replicas=3

# Update the image
kubectl -n apps set image deployment/myapp myapp=nginx:1.25

# Restart a deployment (rolling restart)
kubectl -n apps rollout restart deployment myapp

# View rollout status
kubectl -n apps rollout status deployment myapp

# Delete a deployment
kubectl -n apps delete deployment myapp
```

## Services

```bash
# Expose a deployment
kubectl -n apps expose deployment myapp --port=80 --target-port=3000

# List services
kubectl -n apps get svc

# Check service endpoints
kubectl -n apps get endpoints myapp
```

## Ingress

```bash
# List all ingress rules
kubectl get ingress -A

# Create/update ingress from file
kubectl apply -f ingress.yaml

# Edit ingress live
EDITOR=nano kubectl -n apps edit ingress myapp-ing

# Test routing locally
curl -i -H "Host: myapp.nstsdc.org" http://127.0.0.1
```

## Namespaces

```bash
# List namespaces
kubectl get ns

# Create a namespace
kubectl create namespace myname

# Delete a namespace (deletes everything inside)
kubectl delete namespace myname
```

## Helm

```bash
# List installed releases
helm list -A

# Upgrade a release
helm upgrade <release> <chart> --namespace <ns> -f values.yaml

# View release history
helm history <release> -n <ns>
```

## System services

```bash
# K3s
sudo systemctl status k3s
sudo systemctl restart k3s
sudo journalctl -u k3s -f

# Cloudflare Tunnel
sudo systemctl status cloudflared
sudo systemctl restart cloudflared

# Playit (Minecraft tunnel)
sudo systemctl status playit
sudo systemctl start playit
sudo systemctl stop playit
```

## Network debugging

```bash
# What is listening on this node
sudo ss -tulpn

# Test HTTP routing (on nst-n1)
curl -i -H "Host: myapp.nstsdc.org" http://127.0.0.1

# Test TCP connectivity
nc -vz <host> <port>

# DNS lookup
dig myapp.nstsdc.org +short
nslookup myapp.nstsdc.org
```

## Cleanup

```bash
# Remove an app completely
kubectl -n apps delete deployment myapp
kubectl -n apps delete svc myapp
kubectl -n apps delete ingress myapp-ing

# Force-delete a stuck pod
kubectl -n apps delete pod <pod-name> --force --grace-period=0
```
