# Tutorial: Get a Public URL

Every app deployed on the cluster can be made publicly accessible at a `*.nstsdc.org` URL. This tutorial explains how that works and how to set it up.

## How public URLs work

The domain `nstsdc.org` has a wildcard DNS record pointing to the Cloudflare Tunnel. This means any subdomain — `myapp.nstsdc.org`, `portfolio.nstsdc.org`, `anything.nstsdc.org` — automatically resolves to the tunnel without any DNS configuration.

When a request arrives for `myapp.nstsdc.org`:

1. Cloudflare DNS resolves it to the tunnel
2. The tunnel forwards it to Traefik on nst-n1
3. Traefik looks for an Ingress rule matching `myapp.nstsdc.org`
4. If found, traffic is routed to your app

The only thing you need to do is create an Ingress with the right hostname.

## Creating an Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ing
  namespace: your-namespace
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

```bash
kubectl apply -f ingress.yaml
```

That is it. Within seconds, `myapp.nstsdc.org` is live.

## Choosing a subdomain

Pick something descriptive. Current convention:

- `appname.nstsdc.org` for standalone apps (e.g., `overleaf.nstsdc.org`)
- `appname-username.nstsdc.org` for student projects (e.g., `portfolio-john.nstsdc.org`)

Avoid conflicts with existing subdomains. Check what is taken:

```bash
kubectl get ingress -A
```

## Multiple paths on one hostname

You can route different paths to different services under the same hostname:

```yaml
spec:
  rules:
    - host: myapp.nstsdc.org
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 8080
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

More specific paths should come first.

## HTTPS

By default, your app is accessible over HTTPS thanks to Cloudflare's edge TLS. Users visiting `https://myapp.nstsdc.org` get a valid TLS certificate from Cloudflare automatically. You do not need to configure any certificates.

The connection from Cloudflare to the cluster goes through an encrypted tunnel, so the full path is secure even though Traefik serves plain HTTP internally.

## Verifying your URL

```bash
# On the cluster
curl -i -H "Host: myapp.nstsdc.org" http://127.0.0.1

# From anywhere
curl -i http://myapp.nstsdc.org

# Or just open it in a browser
```

## Troubleshooting

**404 from Traefik:** No Ingress matches the hostname. Check:
```bash
kubectl get ingress -A | grep myapp
```

**503 from Traefik:** The Ingress exists but the backend service or pod is down:
```bash
kubectl -n your-namespace get pods
kubectl -n your-namespace get svc
```

**Browser shows HSTS error or SSL_VERSION_OR_CIPHER_MISMATCH:** Try in an incognito window. Cloudflare's HTTPS rewrites may be interfering. If using plain HTTP, make sure the URL starts with `http://`, not `https://`.
