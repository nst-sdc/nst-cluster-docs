# Fleet (GitOps)

Fleet is Rancher's built-in GitOps engine. It watches Git repositories and automatically deploys their contents to the cluster.

## What GitOps means

Instead of running `kubectl apply` manually, you push your Kubernetes manifests to a Git repository. Fleet detects the change and applies it to the cluster. This means:

- Your cluster state is defined in Git (the single source of truth)
- Changes are tracked, reviewed, and reversible through Git history
- No one needs to run `kubectl` directly for routine deployments

## Current state

Fleet was installed automatically as part of the Rancher deployment. It is running in the `cattle-fleet-system` namespace:

```bash
kubectl -n cattle-fleet-system get pods
```

Components:
- `fleet-controller` — watches Git repos and reconciles state
- `gitjob` — clones repositories and processes manifests
- `helmops` — handles Helm-based deployments
- `fleet-agent` — runs in `cattle-fleet-local-system`, applies changes to the local cluster

Fleet is operational but has not yet been configured with student Git repositories. This is a planned next step.

## How Fleet works

1. You define a `GitRepo` resource pointing to a repository
2. Fleet clones the repo and watches for changes
3. When a change is detected, Fleet processes the manifests (plain YAML or Helm charts)
4. Fleet applies the manifests to the target cluster
5. Fleet continuously reconciles — if someone manually changes something, Fleet reverts it to match Git

## Setting up a GitRepo (example)

```yaml
apiVersion: fleet.cattle.io/v1alpha1
kind: GitRepo
metadata:
  name: student-app
  namespace: fleet-default
spec:
  repo: https://github.com/student/my-app
  branch: main
  paths:
    - k8s/
  targets:
    - clusterSelector:
        matchLabels:
          management.cattle.io/cluster-display-name: local
```

This tells Fleet: "Watch the `k8s/` directory in `https://github.com/student/my-app` on the `main` branch. Deploy whatever manifests you find there to the local cluster."

## Fleet via Rancher UI

You can manage Fleet repositories through the Rancher UI:

1. Go to Continuous Delivery (in the left sidebar)
2. Navigate to Git Repos
3. Add a new repository

## Planned use

The vision for Fleet in this cluster is:

1. Each student (or team) has a Git repository with their Kubernetes manifests
2. Fleet watches these repositories
3. When a student pushes a change, their app is automatically deployed or updated
4. Students learn GitOps as a natural part of their workflow

This replaces the manual process of SSH-ing into the cluster and running `kubectl apply`.

## Health check

```bash
# Fleet controller and related pods
kubectl -n cattle-fleet-system get pods

# Fleet agent
kubectl -n cattle-fleet-local-system get pods

# Git repos being watched
kubectl -n fleet-default get gitrepo
```

Note: Fleet components may show high restart counts. This is a known behavior with Rancher's Fleet deployment and usually does not indicate a real problem as long as the pods are running.
