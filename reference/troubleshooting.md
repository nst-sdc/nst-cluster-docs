# Troubleshooting

Common problems and how to fix them.

## Node shows NotReady

**Most likely cause:** The machine is physically powered off or has lost network connectivity.

**Check:**
```bash
# Can you reach it?
ping 192.168.136.146

# If reachable, check the agent
ssh nst-n2 "sudo systemctl status k3s-agent"
ssh nst-n2 "sudo journalctl -u k3s-agent --no-pager -n 50"
```

**Fix:** If the machine is off, turn it on. If the agent crashed, restart it:
```bash
ssh nst-n2 "sudo systemctl restart k3s-agent"
```

## SSH disconnects when restarting cloudflared

This is expected. The SSH connection goes through the Cloudflare Tunnel. When cloudflared restarts, the tunnel drops and your session dies.

**Workaround:** After running `sudo systemctl restart cloudflared`, wait a few seconds and reconnect.

## websocket: bad handshake errors

**Cause:** The Cloudflare Tunnel ingress rules are in the wrong order. The wildcard HTTP rule is matching before the SSH rule.

**Fix:** In `/etc/cloudflared/config.yml`, make sure exact hostname rules (especially SSH) come before the wildcard:

```yaml
ingress:
  - hostname: "nst-n1.nstsdc.org"
    service: ssh://localhost:22       # exact match first

  - hostname: "*.nstsdc.org"
    service: http://localhost:80      # wildcard after

  - service: http_status:404
```

Restart cloudflared after fixing.

## ERR_SSL_VERSION_OR_CIPHER_MISMATCH in browser

**Cause:** The browser is trying HTTPS but the origin is serving plain HTTP. This can happen due to HSTS headers or Cloudflare's HTTPS rewrite settings.

**Fix:**
1. Try in an incognito/private window
2. Use `http://` explicitly in the URL
3. Check Cloudflare dashboard: SSL/TLS > Edge Certificates > Always Use HTTPS — turn off if causing issues for HTTP-only apps

## kubectl: permission denied

**Cause:** The kubeconfig at `~/.kube/config` is not readable, or you are trying to use `kubectl` without copying the config from K3s.

**Fix:**
```bash
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
chmod 600 ~/.kube/config
```

## kubectl: connection refused to 127.0.0.1:6443

**Cause:** The kubeconfig still points to `127.0.0.1` instead of the control plane's actual IP.

**Fix:** Edit `~/.kube/config` and change:
```yaml
server: https://192.168.136.145:6443
```

## Pod stuck in Pending

```bash
kubectl describe pod <pod-name> -n <namespace>
```

Look at the Events section. Common causes:

- **Insufficient resources:** No node has enough CPU or memory. Scale down other workloads or add a node.
- **Node selector mismatch:** The pod requires `role=compute` but no nodes with that label are Ready.
- **PVC not bound:** The pod needs a PersistentVolumeClaim that cannot be provisioned.

## Pod stuck in ImagePullBackOff

The container image cannot be pulled. Check:
1. Is the image name correct? Typos are common.
2. Is the registry reachable from the cluster?
3. For private images, is an `imagePullSecret` configured?

```bash
kubectl describe pod <pod-name> -n <namespace> | grep -A5 "Events"
```

## Pod in CrashLoopBackOff

Your application is crashing repeatedly. Check the logs:

```bash
kubectl logs <pod-name> -n <namespace>
kubectl logs <pod-name> -n <namespace> --previous
```

Common causes:
- Missing environment variables
- Cannot connect to a database or external service
- Application bug
- Wrong command or entrypoint in the container

## Pod stuck in Terminating

```bash
# Wait a minute first — graceful shutdown takes time

# If still stuck, force delete
kubectl delete pod <pod-name> -n <namespace> --force --grace-period=0
```

## Ingress returns 404

Traefik cannot find a matching Ingress rule.

```bash
# Check if the Ingress exists
kubectl get ingress -A | grep <hostname>

# Check the Ingress details
kubectl describe ingress <name> -n <namespace>
```

Common causes:
- Hostname in the Ingress does not match the request URL
- Ingress is in a different namespace than expected
- `ingressClassName: traefik` is missing

## Ingress returns 503

The Ingress exists but the backend is not ready.

```bash
# Check if the Service has endpoints
kubectl get endpoints <service-name> -n <namespace>

# If empty, the selector does not match any running pods
kubectl get pods -n <namespace> --show-labels
kubectl get svc <service-name> -n <namespace> -o yaml | grep selector
```

## High restart counts on Rancher/Fleet pods

Some Rancher and Fleet controller pods may show hundreds of restarts. This is common on resource-constrained clusters — the controllers get OOM-killed or lose API connectivity briefly.

As long as the pods are currently Running and the Rancher UI is accessible, the restart counts are cosmetic. If Rancher becomes unresponsive, check memory usage:

```bash
kubectl top pods -n cattle-system
kubectl top pods -n cattle-fleet-system
```

## Cloudflared fails to start

```bash
sudo journalctl -u cloudflared --no-pager -n 50
```

Common causes:
- Missing or invalid credentials file
- Missing `cert.pem` (for tunnel route commands)
- Invalid YAML in `config.yml`
- Missing catch-all rule in ingress configuration
