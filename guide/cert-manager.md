# cert-manager and TLS

cert-manager automates the creation and renewal of TLS certificates in Kubernetes. It is primarily used by Rancher in this cluster, but can be extended to provide HTTPS for any app.

## What cert-manager does

When you create a Certificate resource (or an Ingress with TLS annotations), cert-manager:

1. Generates a private key
2. Creates a Certificate Signing Request (CSR)
3. Submits the CSR to a certificate authority (like Let's Encrypt, or Rancher's internal CA)
4. Stores the resulting certificate as a Kubernetes Secret
5. Renews the certificate before it expires

## Installation

cert-manager was installed via Helm:

```bash
kubectl create namespace cert-manager

helm repo add jetstack https://charts.jetstack.io
helm repo update

helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --set crds.enabled=true
```

The `crds.enabled=true` flag installs the Custom Resource Definitions that cert-manager needs (Certificate, Issuer, ClusterIssuer, etc.).

Current version: cert-manager v1.19.2

## Components

cert-manager runs three pods:

| Pod | Purpose |
|---|---|
| cert-manager | Core controller — watches Certificate resources and issues them |
| cert-manager-webhook | Validates cert-manager resources on creation |
| cert-manager-cainjector | Injects CA bundles into webhook configurations |

```bash
kubectl -n cert-manager get pods
```

## How Rancher uses cert-manager

Rancher generates its own self-signed CA certificate using cert-manager. This CA signs the TLS certificate for `rancher.nstsdc.org`.

The certificate is stored as a Kubernetes Secret:

```bash
kubectl -n cattle-system get secret tls-rancher-ingress
```

You can inspect the Certificate and Issuer resources:

```bash
kubectl -n cattle-system get certificate,issuer
```

## Current TLS model

| Service | TLS at Edge (Cloudflare) | TLS at Origin (Cluster) |
|---|---|---|
| Rancher | Cloudflare provides HTTPS to users | Self-signed cert via cert-manager |
| All other apps | Cloudflare provides HTTPS to users | Plain HTTP (no TLS at origin) |

For most apps, Cloudflare's edge TLS is sufficient. The connection between Cloudflare and the cluster goes through an encrypted tunnel, so the lack of origin TLS is not a significant security risk.

## Adding Let's Encrypt certificates (future)

To add proper TLS certificates for apps (not just Rancher), you would:

1. Create a ClusterIssuer for Let's Encrypt:
   ```yaml
   apiVersion: cert-manager.io/v1
   kind: ClusterIssuer
   metadata:
     name: letsencrypt-prod
   spec:
     acme:
       server: https://acme-v02.api.letsencrypt.org/directory
       email: your-email@example.com
       privateKeySecretRef:
         name: letsencrypt-prod
       solvers:
         - http01:
             ingress:
               class: traefik
   ```

2. Annotate your Ingress:
   ```yaml
   metadata:
     annotations:
       cert-manager.io/cluster-issuer: "letsencrypt-prod"
   spec:
     tls:
       - hosts:
           - myapp.nstsdc.org
         secretName: myapp-tls
   ```

3. cert-manager will automatically provision and renew the certificate.

This has not been set up for general use yet, but the infrastructure (cert-manager) is already in place.
