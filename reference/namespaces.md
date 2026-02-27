# Namespace Inventory

Every workload on the cluster lives in a namespace. This is the complete inventory of namespaces and what they contain.

## System namespaces

### kube-system

Core Kubernetes components installed by K3s.

| Pod | Purpose |
|---|---|
| traefik | Ingress controller — routes HTTP traffic |
| coredns | Cluster-internal DNS |
| metrics-server | Collects CPU/memory usage data |
| local-path-provisioner | Creates PersistentVolumes on local disk |
| svclb-traefik (one per node) | LoadBalancer emulation for Traefik |

```bash
kubectl -n kube-system get pods
```

### cert-manager

TLS certificate automation. Used by Rancher.

| Pod | Purpose |
|---|---|
| cert-manager | Core certificate controller |
| cert-manager-webhook | Validates certificate resources |
| cert-manager-cainjector | Injects CA bundles |

### cattle-system

Rancher server and supporting components.

| Pod | Purpose |
|---|---|
| rancher | Cluster management UI and API |
| rancher-webhook | Validates Rancher resources |
| system-upgrade-controller | Manages K3s upgrades |

### cattle-fleet-system

Fleet GitOps engine (deployed by Rancher).

| Pod | Purpose |
|---|---|
| fleet-controller | Watches Git repos and reconciles state |
| gitjob | Clones repositories |
| helmops | Processes Helm-based deployments |

### cattle-fleet-local-system

Fleet agent for the local cluster.

| Pod | Purpose |
|---|---|
| fleet-agent | Applies Fleet-managed resources to this cluster |

### cattle-capi-system

Cluster API controller (deployed by Rancher for multi-cluster management).

### cattle-turtles-system

Rancher Turtles — CAPI integration layer.

## Application namespaces

### apps

Shared namespace for student applications deployed via NST Init.

Current workloads:
| Deployment | Host |
|---|---|
| nst-init | init.nstsdc.org |
| whoami (demo) | whoami.nstsdc.org |
| ava-voice-detection-api | ava-voice-detection-api.nstsdc.org |

### notebooks

JupyterHub and user notebook servers.

### overleaf

Self-hosted Overleaf with MongoDB and Redis.

| Pod | Type |
|---|---|
| overleaf | Deployment |
| mongo-0 | StatefulSet |
| redis-0 | StatefulSet |

### minecraft

Minecraft Java server.

| Pod | Type |
|---|---|
| minecraft-0 | StatefulSet |

### exekute

Private container registry.

| Pod | Purpose |
|---|---|
| registry | Docker registry (NodePort 30500) |

### fleet-default

Default Fleet namespace. Contains GitRepo resources and cleanup CronJobs.

## Per-student namespaces

Students who deploy through kubectl (rather than NST Init) may have their own namespaces:

| Namespace | Contents |
|---|---|
| khushthecoder | Snake game |
| yashsingh045 | Portfolio, FoodKart, voice assistant |
| yashtesting | Portfolio (testing) |

## Listing namespaces

```bash
# All namespaces
kubectl get ns

# Pods in a specific namespace
kubectl -n <namespace> get pods

# Everything in a namespace
kubectl -n <namespace> get all
```

## Creating a namespace

```bash
kubectl create namespace my-namespace
```

## Deleting a namespace

This deletes the namespace and everything inside it:

```bash
kubectl delete namespace my-namespace
```

Use with caution — there is no undo.
