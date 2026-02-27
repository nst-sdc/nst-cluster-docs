# Traefik Ingress

Traefik is the ingress controller for the cluster. It receives all incoming HTTP(S) traffic and routes it to the correct Kubernetes service based on the `Host` header.

## How K3s installs Traefik

K3s automatically deploys Traefik using a HelmChart manifest at:

```
/var/lib/rancher/k3s/server/manifests/
```

You do not need to install Traefik manually. When K3s starts, it processes this manifest and deploys Traefik into the `kube-system` namespace.

Current version: Traefik v3.5.1

## How Traefik works in this cluster

```
Cloudflare Tunnel → localhost:80 → Traefik → checks Host header → matches Ingress → forwards to Service → Pod
```

Traefik listens on ports 80 (HTTP) and 443 (HTTPS) on every node. When a request arrives:

1. Traefik reads the `Host` header (e.g., `whoami.nstsdc.org`)
2. It searches for an Ingress resource with a matching host rule
3. If found, it forwards the request to the specified backend Service
4. If not found, it returns a 404

## The Traefik service

```bash
kubectl -n kube-system get svc traefik
```

Output:
```
NAME      TYPE           CLUSTER-IP     EXTERNAL-IP                  PORT(S)
traefik   LoadBalancer   10.43.112.48   192.168.136.145,...,149      80:30767/TCP,443:30705/TCP
```

The service type is `LoadBalancer`. Since there is no cloud provider, K3s uses its built-in ServiceLB (formerly Klipper) to emulate it. ServiceLB creates a `svclb-traefik` pod on every node, which forwards traffic from the node's IP to Traefik.

## Ingress resources

An Ingress is a Kubernetes resource that tells Traefik how to route traffic. Here is the basic pattern:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ing
  namespace: apps
spec:
  ingressClassName: traefik
  rules:
    - host: myapp.nstsdc.org
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: myapp
                port:
                  number: 80
```

This tells Traefik: "When you receive a request for `myapp.nstsdc.org`, forward it to the `myapp` service on port 80."

## Listing all ingress rules

```bash
kubectl get ingress -A
```

This shows every hostname-to-service mapping in the cluster.

## Testing ingress locally

You can test routing without going through Cloudflare by curling localhost with a Host header:

```bash
# On nst-n1
curl -i -H "Host: whoami.nstsdc.org" http://127.0.0.1
```

If you get a 404, either the Ingress does not exist or the hostname does not match. If you get a 503, the backend service or pod is down.

## Default 404 behavior

If Traefik receives a request with a Host header that does not match any Ingress rule, it returns:

```
HTTP/1.1 404 Not Found
```

This is expected. It means Traefik is running correctly but there is no Ingress for that hostname.

```bash
# This should return 404 (no Ingress for localhost)
curl -I http://localhost
```

## TLS considerations

Currently, most apps use plain HTTP. Cloudflare provides TLS at the edge (between the user's browser and Cloudflare), but the connection from Cloudflare to the cluster through the tunnel is unencrypted HTTP.

The exception is Rancher, which uses HTTPS on port 443 with a self-signed certificate. The Cloudflare Tunnel rule for Rancher includes `noTLSVerify: true` to accept the self-signed cert.

For apps that need end-to-end TLS, cert-manager can provision Let's Encrypt certificates. This is not yet configured for general app use.

## Useful commands

```bash
# Traefik pods
kubectl -n kube-system get pods | grep traefik

# Traefik service (check external IPs and ports)
kubectl -n kube-system get svc traefik

# All ingress rules across all namespaces
kubectl get ingress -A

# Traefik logs
kubectl -n kube-system logs -l app.kubernetes.io/name=traefik --tail=50
```
