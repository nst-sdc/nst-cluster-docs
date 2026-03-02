# Student Sandbox System

A self-service platform that gives every student their own isolated Linux container on a Kubernetes cluster — complete with SSH access, a web server, and a public URL. Students provision from their laptops, SSH into their sandbox, and deploy websites at `<roll>.nstsdc.org`.

This document serves as both user documentation and a build tutorial. If you're looking to build something similar for your own cluster, read the [Building It](#building-it) section.

---

## User Guide

### How it works

```
Student laptop → cloudflared tunnel → SSH Bastion → Student Pod
Browser → <roll>.nstsdc.org → Cloudflare tunnel → Traefik Ingress → Student Pod :80
```

Each sandbox is an Alpine Linux container running:

- **SSH server** — for remote access
- **nginx** — serves static files from `~/public/` (default)
- **Node.js + npm** — for building and running apps
- **git, vim, nano** — for pulling code and editing files

Students deploy on **port 80** — just like a real production server.

Resources per student: 128MB RAM, 200m CPU, 512MB persistent storage.

### Quick start

#### 1. Install the tools

```bash
curl -sL https://sandbox.nstsdc.org/install | bash
```

This installs three things:

- **cloudflared** — Cloudflare tunnel client (needed for SSH access over the internet)
- **nst-sandbox** — CLI to create/manage your sandbox
- **nst-ssh** — Quick SSH command

#### 2. Create your sandbox

```bash
nst-sandbox <your-roll-number>
```

Example output:

```
$ nst-sandbox 2024001

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🎓 NST Sandbox: 2024001

  🔑 SSH:      nst-ssh 2024001
  🔒 Password: k7m2np4x
  🌐 Website:  http://2024001.nstsdc.org

  Connect:     nst-ssh 2024001
  Then edit:   nano ~/public/index.html

  Full SSH:    ssh -o ProxyCommand="cloudflared access ssh
               --hostname sandbox-ssh.nstsdc.org"
               2024001@sandbox-ssh.nstsdc.org
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Credentials are saved in `~/.nst-sandbox/config.json`. Run the same command again to see them.

#### 3. Connect and deploy

```bash
nst-ssh 2024001
# enter your password

cd ~/public
nano index.html
# your site is live at http://2024001.nstsdc.org
```

### CLI reference

```bash
nst-sandbox <roll-number>    # Create your sandbox (or show existing)
nst-sandbox --info            # Show your credentials and status
nst-sandbox --ssh             # SSH into your sandbox
nst-sandbox --remove          # Delete your sandbox
nst-sandbox --help            # Show help

nst-ssh <roll-number>         # SSH directly into your sandbox
nst-ssh <roll>@sandbox-ssh.nstsdc.org  # Full form
```

### Deploying your website

#### Static site (default)

Your sandbox comes with nginx serving files from `~/public/` on port 80. Just put your HTML/CSS/JS there:

```
~/public/
├── index.html
├── style.css
└── script.js
```

Edit and save — your site is live immediately at `http://<your-roll>.nstsdc.org`.

#### Node.js / Python / any server

To run your own server, stop nginx first and bind to **port 80**:

```bash
# Stop nginx
sudo nginx -s stop

# Run your app on port 80
node app.js                # must listen on port 80
python -m http.server 80
```

::: warning
Your app **must** listen on port 80. This simulates real-world deployment — the cluster routes all HTTP traffic to port 80 of your container, just like a production server would.
:::

**Example: Express app**

```js
// app.js
const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Hello from NST!'));

app.listen(80, () => console.log('Server running on port 80'));
```

```bash
sudo nginx -s stop
node app.js
```

**Switching back to static:**

```bash
# Kill your app (Ctrl+C), then restart nginx
sudo nginx
```

### Troubleshooting

| Problem | Solution |
|---------|----------|
| "Sandbox already exists" | Run `nst-sandbox <your-roll>` again to see saved credentials |
| Can't SSH in | Make sure you ran the installer. You need `cloudflared` installed. |
| Website not loading | Check files are in `~/public/` or your server is on port 80 |
| Lost password | Run `nst-sandbox <your-roll>`. If config is deleted, ask instructor to reset. |
| Permission denied on port 80 | Stop nginx first with `sudo nginx -s stop` |
| "cloudflared not found" | Re-run: `curl -sL https://sandbox.nstsdc.org/install \| bash` |

---

## For Instructors

### Admin CLI on nst-n1

The `nst-sandbox` admin CLI is installed at `/usr/local/bin/nst-sandbox` on nst-n1.

```bash
# SSH into nst-n1 first
ssh nst-n1

nst-sandbox create <student-id>          # Create a single sandbox
nst-sandbox delete <student-id>          # Delete permanently
nst-sandbox reset  <student-id>          # Fresh start (new password, data wiped)
nst-sandbox stop   <student-id>          # Free resources, preserve data
nst-sandbox start  <student-id>          # Restart a stopped sandbox
nst-sandbox list                          # List all active sandboxes
nst-sandbox info   <student-id>          # Show details + resource usage
nst-sandbox bulk   students.csv          # Bulk provision from CSV
```

### Bulk provisioning

Create a CSV file with one student ID per line (optionally with a custom password):

```csv
2024001
2024002,custompassword
2024003
```

```bash
nst-sandbox bulk students.csv
```

Credentials are saved to `sandbox-credentials-<timestamp>.txt`.

### API endpoints

The provisioning API runs at `sandbox.nstsdc.org`:

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/create` | Create sandbox (idempotent — returns existing creds if sandbox exists) | None |
| `DELETE` | `/sandbox/:id` | Delete a sandbox | Bearer token (owner or admin) |
| `GET` | `/info/:id` | Get sandbox status | None |
| `GET` | `/list` | List all sandboxes | Admin key |
| `GET` | `/install` | Installer script | None |
| `GET` | `/client` | Client CLI script | None |
| `GET` | `/health` | Health check | None |

Admin operations require `Authorization: Bearer <admin-key>` header.

### Resource planning

| Resource | Per Student | 314 Students |
|----------|-------------|--------------|
| RAM      | 128MB limit | ~40GB        |
| CPU      | 200m limit  | 62 cores (burst) |
| Storage  | 512MB PVC   | ~157GB       |

Not all students will be active simultaneously. Use `nst-sandbox stop` to pause inactive sandboxes and reclaim resources.

---

## Building It

This section walks through how we built the entire system. You can use this as a guide to build something similar on any Kubernetes cluster with Cloudflare Tunnels.

### Prerequisites

- A Kubernetes cluster (we used K3s on 5 bare-metal nodes with ~48GB total RAM)
- Traefik ingress controller (ships with K3s)
- Cloudflare Tunnel (`cloudflared`) for internet access — or any other reverse proxy
- A wildcard DNS entry (`*.yourdomain.org → your tunnel/ingress`)
- A container registry accessible from your cluster nodes
- `kubectl` and `docker` on the control plane node

### Architecture overview

The system has four components:

```
┌─────────────────────────────────────────────────────────────┐
│  Component 1: Sandbox Container Image                        │
│  Alpine + sshd + nginx + node + git                          │
│  Runs per-student — serves their website on port 80          │
├─────────────────────────────────────────────────────────────┤
│  Component 2: Admin CLI                                      │
│  Bash script on control plane — create/delete/list/bulk      │
│  Uses kubectl + YAML templates to manage K8s resources       │
├─────────────────────────────────────────────────────────────┤
│  Component 3: Provisioning API                               │
│  Node.js HTTP server — lets students self-provision          │
│  Token-based auth for self-deletion                          │
├─────────────────────────────────────────────────────────────┤
│  Component 4: SSH Bastion                                    │
│  Node.js SSH proxy — routes ssh user@bastion to the right    │
│  student pod via ClusterIP lookup                            │
└─────────────────────────────────────────────────────────────┘
```

Per-student K8s resources (each in a `sandbox-<id>` namespace):

- **Pod** — the sandbox container
- **PVC** — 512MB persistent storage mounted at `/home/<id>`
- **Service (NodePort)** — SSH access (port 30000+)
- **Service (ClusterIP)** — HTTP on port 80
- **Ingress** — `<id>.yourdomain.org` pointing to the HTTP service

Shared resources (in `nst-sandbox-api` namespace):

- **Provisioning API** deployment + service + ingress
- **SSH Bastion** deployment + service (NodePort 30022)
- **PVCs** for token storage and bastion host key persistence
- **RBAC** — service accounts with permissions to manage namespaces, pods, services, etc.

### Step 1: Build the sandbox container image

This is the image every student runs. Alpine-based to keep it lightweight (~45MB).

**Dockerfile:**

```dockerfile
FROM alpine:3.21

RUN apk add --no-cache \
    openssh-server nginx nodejs npm git curl bash \
    shadow sudo vim nano \
    && mkdir -p /run/nginx /run/sshd \
    && ssh-keygen -A

COPY nginx.conf /etc/nginx/http.d/default.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 22 80
ENTRYPOINT ["/entrypoint.sh"]
```

**nginx.conf** — simple static file server. The `__HOME__` placeholder is replaced at runtime by the entrypoint:

```nginx
server {
    listen 80 default_server;
    root __HOME__/public;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ =404;
        autoindex on;
    }
}
```

**entrypoint.sh** — creates the student user, configures SSH, sets up nginx, seeds a welcome page, and allows the student to stop nginx and bind to port 80 themselves:

```bash
#!/bin/bash
set -e

USERNAME="${STUDENT_USER:-student}"
PASSWORD="${STUDENT_PASS:-changeme}"

# Create user if doesn't exist (first boot)
if ! id "$USERNAME" &>/dev/null; then
    adduser -D -s /bin/bash "$USERNAME"
    echo "$USERNAME:$PASSWORD" | chpasswd
    mkdir -p /home/$USERNAME/public

    # Seed a welcome page
    cat > /home/$USERNAME/public/index.html << 'WELCOME'
    <!DOCTYPE html>
    <html>
    <head><title>NST Sandbox</title></head>
    <body>
        <h1>Welcome to your NST Sandbox!</h1>
        <p>Edit ~/public/index.html to change this page.</p>
        <p>Or stop nginx and run your own server on port 80.</p>
    </body>
    </html>
WELCOME

    chown -R $USERNAME:$USERNAME /home/$USERNAME

    # Let student stop/start nginx
    echo "$USERNAME ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /bin/kill" \
        >> /etc/sudoers.d/sandbox
    chmod 440 /etc/sudoers.d/sandbox
fi

# Swap in the real home path
sed -i "s|__HOME__|/home/$USERNAME|g" /etc/nginx/http.d/default.conf

# SSH config — password auth, no root login
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
echo "AllowUsers $USERNAME" >> /etc/ssh/sshd_config

# Let non-root bind to privileged ports (so student can run servers on :80)
if [ -f /proc/sys/net/ipv4/ip_unprivileged_port_start ]; then
    echo 0 > /proc/sys/net/ipv4/ip_unprivileged_port_start 2>/dev/null || true
fi

nginx
exec /usr/sbin/sshd -D -e
```

**Build and push:**

```bash
docker build -t your-registry/nst-sandbox:latest .
docker push your-registry/nst-sandbox:latest
```

### Step 2: Create the K8s pod template

The admin CLI uses `sed` to replace placeholders and then `kubectl apply`. This template creates all K8s resources for a single student:

```yaml
# sandbox-pod.yaml — template with __PLACEHOLDERS__
apiVersion: v1
kind: Namespace
metadata:
  name: sandbox-__STUDENT_ID__
  labels:
    app: nst-sandbox
    student: "__STUDENT_ID__"
---
apiVersion: v1
kind: Pod
metadata:
  name: sandbox
  namespace: sandbox-__STUDENT_ID__
  labels:
    app: nst-sandbox
    student: "__STUDENT_ID__"
spec:
  containers:
  - name: sandbox
    image: __IMAGE__
    env:
    - name: STUDENT_USER
      value: "__STUDENT_ID__"
    - name: STUDENT_PASS
      value: "__PASSWORD__"
    ports:
    - containerPort: 22
      name: ssh
    - containerPort: 80
      name: http
    resources:
      requests:
        memory: "32Mi"
        cpu: "25m"
      limits:
        memory: "128Mi"
        cpu: "200m"
    volumeMounts:
    - name: student-data
      mountPath: /home/__STUDENT_ID__
  securityContext:
    sysctls:
    - name: net.ipv4.ip_unprivileged_port_start
      value: "0"
  volumes:
  - name: student-data
    persistentVolumeClaim:
      claimName: student-pvc
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: student-pvc
  namespace: sandbox-__STUDENT_ID__
spec:
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 512Mi
  storageClassName: local-path
---
# NodePort service — each student gets a unique port (30000+)
apiVersion: v1
kind: Service
metadata:
  name: sandbox-ssh
  namespace: sandbox-__STUDENT_ID__
spec:
  type: NodePort
  selector:
    app: nst-sandbox
    student: "__STUDENT_ID__"
  ports:
  - port: 22
    targetPort: 22
    nodePort: __SSH_PORT__
    name: ssh
---
# ClusterIP service for HTTP — used by ingress
apiVersion: v1
kind: Service
metadata:
  name: sandbox-http
  namespace: sandbox-__STUDENT_ID__
spec:
  type: ClusterIP
  selector:
    app: nst-sandbox
    student: "__STUDENT_ID__"
  ports:
  - port: 80
    targetPort: 80
    name: http
---
# Ingress — maps <id>.nstsdc.org to this pod's port 80
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sandbox-ingress
  namespace: sandbox-__STUDENT_ID__
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: web,websecure
spec:
  rules:
  - host: __STUDENT_ID__.nstsdc.org
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: sandbox-http
            port:
              number: 80
```

**Key design decisions:**

- **One namespace per student** — clean isolation, easy to list and delete
- **PVC for home directory** — survives pod restarts
- **NodePort for SSH** — the bastion uses ClusterIP directly, but NodePort is there for campus-direct access too
- **`sysctls` for unprivileged port binding** — lets students run servers on port 80 without root. K3s needs `--kube-apiserver-arg=feature-gates=...` or `--kubelet-arg=allowed-unsafe-sysctls=net.ipv4.ip_unprivileged_port_start` if your cluster blocks unsafe sysctls. The entrypoint also sets this at runtime as a fallback.
- **Labels `app: nst-sandbox`** — used to list all sandboxes cluster-wide

### Step 3: Build the admin CLI

The admin CLI is a bash script that wraps `kubectl` and the pod template. Install it on your control plane node at `/usr/local/bin/nst-sandbox`.

**Core logic** (simplified — see full source for error handling, bulk mode, etc.):

```bash
# Create a sandbox
cmd_create() {
    local student_id="$1"
    local password="$(generate_password)"
    local port=$(find_next_available_nodeport)

    # Fill in template placeholders and apply
    sed -e "s|__STUDENT_ID__|$student_id|g" \
        -e "s|__PASSWORD__|$password|g" \
        -e "s|__SSH_PORT__|$port|g" \
        -e "s|__IMAGE__|$IMAGE|g" \
        "$TEMPLATE" | kubectl apply -f -

    # Wait for pod readiness
    kubectl wait --for=condition=Ready pod/sandbox \
        -n "sandbox-$student_id" --timeout=120s
}

# Delete a sandbox
cmd_delete() {
    kubectl delete namespace "sandbox-$1" --grace-period=10
}

# List all sandboxes
cmd_list() {
    kubectl get namespaces -l app=nst-sandbox
}
```

**Port allocation** works by scanning existing NodePorts across the cluster and finding the next unused port starting from 30000.

**Bulk provisioning** reads a CSV file and calls `cmd_create` in a loop with a 1-second delay between each to avoid hammering the API server.

### Step 4: Build the provisioning API

The API lets students self-provision without SSH access to the control plane. It's a Node.js HTTP server that shells out to the admin CLI.

**Key endpoints:**

- `POST /create` — takes `{"id": "2024001"}`, runs `nst-sandbox create`, returns SSH creds + an auth token
- `DELETE /sandbox/:id` — requires the token that was returned at creation time (or admin key)
- `GET /install` — serves the installer script for `curl | bash`
- `GET /client` — serves the student CLI script

**Token system:**

Each sandbox creation generates a random 48-character hex token. It's stored server-side in a PVC (`/data/tokens/<id>.json`) and returned to the student. The student CLI saves it in `~/.nst-sandbox/config.json`. To delete a sandbox, you must present the matching token. This lets students self-delete without being able to delete each other's sandboxes.

**Idempotent creation:**

If a student runs `nst-sandbox <roll>` twice, the API detects the existing sandbox, loads the saved token file, and returns the same credentials. No duplicate resources are created.

**Dockerfile for the API** — this image includes both the admin CLI and the API server, plus `kubectl`:

```dockerfile
FROM alpine:3.21

RUN apk add --no-cache nodejs npm bash curl openssh-server nginx git \
    shadow sudo vim nano \
    && mkdir -p /run/nginx /run/sshd /opt/nst-sandbox/templates \
    && ssh-keygen -A

# kubectl — needed for the admin CLI to manage K8s resources
RUN curl -LO "https://dl.k8s.io/release/$(curl -Ls \
    https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" \
    && chmod +x kubectl && mv kubectl /usr/local/bin/

# Copy all the pieces
COPY nst-sandbox /opt/nst-sandbox/nst-sandbox
COPY sandbox-pod.yaml /opt/nst-sandbox/templates/sandbox-pod.yaml
COPY server.js /opt/nst-sandbox/server.js
COPY nst-sandbox-client /opt/nst-sandbox/nst-sandbox-client
COPY install.sh /opt/nst-sandbox/install.sh

RUN chmod +x /opt/nst-sandbox/nst-sandbox \
    /opt/nst-sandbox/nst-sandbox-client \
    /opt/nst-sandbox/install.sh \
    && ln -s /opt/nst-sandbox/nst-sandbox /usr/local/bin/nst-sandbox \
    && mkdir -p /data/tokens

EXPOSE 3000
# Started via K8s command override: node /opt/nst-sandbox/server.js
```

**K8s deployment** — the API needs a ServiceAccount with cluster-wide permissions to create namespaces, pods, services, PVCs, and ingresses:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: sandbox-provisioner
  namespace: nst-sandbox-api
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: sandbox-provisioner
rules:
- apiGroups: [""]
  resources: ["namespaces", "pods", "services", "persistentvolumeclaims"]
  verbs: ["*"]
- apiGroups: ["networking.k8s.io"]
  resources: ["ingresses"]
  verbs: ["*"]
---
# ClusterRoleBinding and Deployment omitted for brevity —
# see full YAML in the repo
```

The API is exposed via an Ingress at `sandbox.nstsdc.org`.

### Step 5: Build the SSH bastion

**The problem:** Students need SSH access from the internet. Cloudflare Tunnels only proxy HTTP and standard SSH (port 22) — they can't forward arbitrary TCP ports like NodePort 30001, 30002, etc. So students can't just `ssh student@cluster -p 30001`.

**The solution:** An SSH bastion proxy that:

1. Listens on a single port (2222, exposed as NodePort 30022)
2. Accepts SSH connections with `username@bastion`
3. Uses `kubectl` to look up the ClusterIP of `sandbox-ssh` service in `sandbox-<username>` namespace
4. Proxies the SSH session to the student's actual pod

**How it works:**

```
ssh 2024001@sandbox-ssh.nstsdc.org
  → cloudflared tunnel → NodePort 30022
    → Bastion receives connection
    → kubectl get svc sandbox-ssh -n sandbox-2024001 → ClusterIP 10.43.x.x:22
    → Bastion opens SSH to 10.43.x.x:22 with the student's password
    → If auth succeeds: accept client, pipe streams bidirectionally
    → If auth fails: reject client
```

**bastion/server.js** (core logic):

```js
const ssh2 = require('ssh2');
const { execSync } = require('child_process');

// Look up student's pod via K8s service ClusterIP
function getStudentSSH(username) {
  const json = execSync(
    `kubectl get svc sandbox-ssh -n sandbox-${username} -o json`,
    { timeout: 5000 }
  ).toString();
  const svc = JSON.parse(json);
  return { host: svc.spec.clusterIP, port: svc.spec.ports[0].port };
}

const server = new ssh2.Server({ hostKeys: [hostKey] }, (client) => {
  client.on('authentication', (ctx) => {
    if (ctx.method === 'password') {
      const upstream = getStudentSSH(ctx.username);
      const upstreamConn = new ssh2.Client();

      upstreamConn.on('ready', () => ctx.accept());
      upstreamConn.on('error', () => ctx.reject(['password']));

      // Auth against the actual pod — password forwarding
      upstreamConn.connect({
        host: upstream.host,
        port: upstream.port,
        username: ctx.username,
        password: ctx.password,
      });
    }
  });

  // On ready: pipe shell/exec sessions between client and upstream
  client.on('ready', () => {
    client.on('session', (accept) => {
      const session = accept();
      session.on('shell', (accept) => {
        const clientStream = accept();
        upstreamConn.shell(opts, (err, upstreamStream) => {
          clientStream.pipe(upstreamStream);
          upstreamStream.pipe(clientStream);
        });
      });
    });
  });
});

server.listen(2222);
```

**Key design decisions:**

- **Password forwarding** — the bastion doesn't store passwords. It forwards the student's password to the actual pod for authentication. If the pod accepts it, the bastion accepts the client.
- **ClusterIP lookup** — uses `kubectl` to find the pod's service IP. This means the bastion needs a ServiceAccount with `get` access to namespaces and services.
- **Persistent host key** — stored in a PVC so students don't get SSH host key warnings on every bastion restart.

**Bastion K8s deployment:**

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: sandbox-bastion
  namespace: nst-sandbox-api
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: sandbox-bastion
rules:
- apiGroups: [""]
  resources: ["namespaces", "services"]
  verbs: ["get", "list"]
---
# Deployment with:
#   - NodePort 30022 (service port 2222)
#   - PVC for persistent SSH host key
#   - Init container to generate host key on first run
#   - ServiceAccount with read-only access to namespaces + services
```

### Step 6: Cloudflare Tunnel configuration

Add these entries to your `cloudflared` config (above the wildcard catch-all):

```yaml
ingress:
  # ... other services ...

  # SSH bastion — proxies SSH connections to the bastion pod
  - hostname: "sandbox-ssh.nstsdc.org"
    service: ssh://localhost:30022

  # Wildcard — catches *.nstsdc.org for Traefik
  # (student websites like 2024001.nstsdc.org hit this)
  - hostname: "*.nstsdc.org"
    service: http://localhost:80
```

The wildcard entry already existed for Traefik ingress — student website URLs like `2024001.nstsdc.org` are automatically routed to the right pod via the per-student Ingress resource.

The bastion entry needs to be **above** the wildcard so `sandbox-ssh.nstsdc.org` matches first.

After editing, restart cloudflared:

```bash
sudo systemctl restart cloudflared
```

### Step 7: Student-side tooling

Three scripts are installed on the student's machine:

**Installer (`install.sh`)** — served at `sandbox.nstsdc.org/install`, run via `curl | bash`:

1. Detects OS and architecture (macOS/Linux, amd64/arm64)
2. Installs `cloudflared` (via Homebrew on macOS, direct download on Linux)
3. Downloads and installs the `nst-sandbox` client CLI
4. Writes the `nst-ssh` script

**Client CLI (`nst-sandbox-client`)** — the student-facing `nst-sandbox` command:

- Calls `POST /create` on the API, saves credentials to `~/.nst-sandbox/config.json`
- Supports `--remove` (self-delete via token), `--info`, `--ssh`
- Idempotent: running twice returns saved credentials

**SSH shortcut (`nst-ssh`):**

```bash
#!/bin/bash
# Parses "nst-ssh 2024001" or "nst-ssh 2024001@sandbox-ssh.nstsdc.org"
# Falls back to reading ~/.nst-sandbox/config.json for the roll number

exec ssh -o ProxyCommand="cloudflared access ssh --hostname $HOST" "$USER@$HOST"
```

### Step 8: Container registry setup

All cluster nodes need to pull images from your registry. With K3s, configure mirrors in `/etc/rancher/k3s/registries.yaml` on every node:

```yaml
mirrors:
  "registry.nstsdc.org:5000":
    endpoint:
      - "http://192.168.136.145:30500"
```

Then restart K3s on each node:

```bash
sudo systemctl restart k3s        # master
sudo systemctl restart k3s-agent   # workers
```

In Docker (for building on the control plane), add to `/etc/docker/daemon.json`:

```json
{
  "insecure-registries": ["192.168.136.145:30500"]
}
```

### Build and deploy commands (summary)

```bash
# 1. Build and push sandbox image
cd sandbox/docker/
docker build -t your-registry/nst-sandbox:latest .
docker push your-registry/nst-sandbox:latest

# 2. Build and push API image (includes admin CLI + server)
docker build -t your-registry/nst-sandbox-api:latest -f Dockerfile.full .
docker push your-registry/nst-sandbox-api:latest

# 3. Build and push bastion image
cd sandbox/bastion/
docker build -t your-registry/nst-sandbox-bastion:latest .
docker push your-registry/nst-sandbox-bastion:latest

# 4. Deploy everything
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/bastion-deployment.yaml

# 5. Install admin CLI on control plane
cp scripts/nst-sandbox /usr/local/bin/nst-sandbox
chmod +x /usr/local/bin/nst-sandbox
cp templates/sandbox-pod.yaml /opt/nst-sandbox/templates/

# 6. Add cloudflared tunnel entry and restart
# Edit /etc/cloudflared/config.yml (add sandbox-ssh.nstsdc.org entry)
sudo systemctl restart cloudflared
```

### File structure

```
nst-sandbox/
├── docker/
│   ├── Dockerfile           # Sandbox container (Alpine + sshd + nginx + node)
│   ├── Dockerfile.full      # API container (sandbox + kubectl + server.js)
│   ├── entrypoint.sh        # Container startup script
│   └── nginx.conf           # Default nginx config template
├── bastion/
│   ├── Dockerfile           # SSH bastion image
│   ├── package.json         # ssh2 dependency
│   └── server.js            # SSH proxy server
├── api/
│   └── server.js            # Provisioning API
├── scripts/
│   ├── nst-sandbox          # Admin CLI (bash)
│   ├── nst-sandbox-client   # Student CLI (bash)
│   └── install.sh           # curl|bash installer
├── templates/
│   └── sandbox-pod.yaml     # K8s template with __PLACEHOLDERS__
└── k8s/
    ├── api-deployment.yaml      # API: namespace, RBAC, PVC, deployment, service, ingress
    └── bastion-deployment.yaml  # Bastion: RBAC, PVC, deployment, NodePort service
```

### Adapting for your cluster

To use this on a different cluster:

1. **Domain** — replace `nstsdc.org` everywhere (templates, scripts, cloudflared config)
2. **Registry** — replace `registry.nstsdc.org:5000` with your container registry
3. **Ingress controller** — we used Traefik (K3s default). If you use nginx-ingress, update the ingress annotations
4. **Storage class** — we used `local-path`. Change `storageClassName` in the PVC templates if needed
5. **SSH access** — if you're not using Cloudflare Tunnels, you can skip the bastion entirely and have students SSH directly to NodePorts (works great on a campus network)
6. **Admin key** — change the `ADMIN_KEY` env var in the API deployment
7. **Port range** — the admin CLI starts at NodePort 30000. Adjust `BASE_PORT` if that conflicts with other services
