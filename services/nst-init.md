# NST Init

NST Init is a custom web application that provides self-service deployment for students. Instead of learning kubectl and writing YAML manifests, students can deploy a containerized app through a web UI.

## Accessing NST Init

```
https://init.nstsdc.org
```

Log in with your GitHub account.

## What it does

When you deploy an app through NST Init, it creates three Kubernetes resources in the `apps` namespace:

1. **Deployment** — runs your container image
2. **Service** — exposes the deployment internally
3. **Ingress** — maps a `*.nstsdc.org` hostname to the service

The app name you choose becomes the subdomain: if you name your app `my-portfolio`, it becomes `my-portfolio.nstsdc.org`.

## How it works internally

NST Init runs as a Kubernetes pod with a ServiceAccount that has RBAC permissions to create, update, and delete Deployments, Services, and Ingresses in the `apps` namespace.

This means NST Init can only affect the `apps` namespace — it cannot touch system components or other namespaces.

### RBAC scope

```yaml
rules:
  - apiGroups: ["", "apps", "networking.k8s.io"]
    resources: ["deployments", "services", "ingresses"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
```

### Authentication

NST Init uses GitHub OAuth. When you click "Log in with GitHub," it redirects to GitHub, which asks you to authorize the NST Init app. After authorization, you are redirected back with a session token.

## Technical details

| Property | Value |
|---|---|
| Image | `ghcr.io/krushndayshmookh/nst-init:0.18` |
| Namespace | apps |
| Port | 8080 (internal), 80 (service) |
| Ingress host | init.nstsdc.org |
| Auth | GitHub OAuth |
| App zone | nstsdc.org |

## Environment variables

The deployment uses these configuration values:

| Variable | Purpose |
|---|---|
| `PORT` | Internal port (8080) |
| `K8S_NAMESPACE` | Target namespace for created resources (apps) |
| `APP_ZONE` | Domain suffix for generated hostnames (nstsdc.org) |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret |
| `CALLBACK_URL` | OAuth callback URL |
| `JWT_SECRET` | Secret for signing session tokens |

## Limitations

- Apps are deployed into the `apps` namespace only
- No support for custom resource limits (yet)
- No persistent storage configuration through the UI
- No multi-container or sidecar support

For more advanced deployments, use kubectl directly.
