# Tips and Tricks

Practical advice from operating this cluster.

## Use Host header testing before going public

Before checking if your app works through Cloudflare, test locally on nst-n1. This eliminates DNS, tunnel, and caching from the equation:

```bash
curl -i -H "Host: myapp.nstsdc.org" http://127.0.0.1
```

If this works, the Kubernetes side is correct. If the public URL still fails, the problem is in the tunnel or DNS.

## Use `kubectl describe` before `kubectl logs`

When a pod is not behaving, `describe` gives you the full picture: scheduling decisions, events, restart counts, resource limits, and mount status. Logs only show you what the application printed to stdout.

```bash
kubectl describe pod <name> -n <namespace>
```

## Use `--previous` for crash logs

If a pod is in CrashLoopBackOff, the current logs are from the container that just started (and is about to crash again). The useful logs are from the previous run:

```bash
kubectl logs <pod-name> -n <namespace> --previous
```

## Label everything

Always add meaningful labels to your resources. They make filtering and debugging much easier:

```yaml
metadata:
  labels:
    app: my-app
    owner: krushn
    team: backend
```

Then filter:
```bash
kubectl get pods -l owner=krushn -A
```

## Use `kubectl get all` for a quick overview

```bash
kubectl -n myname get all
```

This shows deployments, replicasets, pods, and services in one command. It does not show Ingresses or PVCs — those need separate commands.

## Exec with bash, fall back to sh

```bash
kubectl exec -it <pod> -n <ns> -- /bin/bash
# If bash is not installed:
kubectl exec -it <pod> -n <ns> -- sh
```

## Port-forward for local testing

If you want to test a service without creating an Ingress:

```bash
kubectl port-forward svc/myapp 8080:80 -n myname
# Then visit http://localhost:8080
```

This is useful for debugging or for services that should not be public.

## Watch resources in real-time

Add `-w` to watch for changes:

```bash
kubectl get pods -n myname -w
```

This streams updates as pods start, stop, or change status. Press Ctrl+C to stop.

## Dry-run before applying

Preview what a command would do without actually doing it:

```bash
kubectl apply -f manifest.yaml --dry-run=client
```

For generating YAML templates:

```bash
kubectl create deployment test --image=nginx --dry-run=client -o yaml > deployment.yaml
```

## Use EDITOR for live editing

```bash
EDITOR=nano kubectl edit deployment myapp -n myname
```

This opens the live resource definition in your editor. Save and close to apply changes. Useful for quick fixes, but do not rely on it — changes made this way are not tracked in Git.

## Check what is using resources

```bash
# Per node
kubectl top nodes

# Per pod (all namespaces)
kubectl top pods -A --sort-by=memory

# Per pod (specific namespace)
kubectl top pods -n apps --sort-by=cpu
```

## One-line rule

> If a file exists but you cannot explain why it exists, it should not exist.

This applies to Kubernetes resources too. If you see a Deployment, Service, or Ingress and cannot explain its purpose, it should probably be cleaned up.
