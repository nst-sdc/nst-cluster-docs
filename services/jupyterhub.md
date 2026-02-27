# JupyterHub

JupyterHub gives every student their own Jupyter notebook server. Log in with GitHub, and you get a Python environment with scientific computing libraries, a terminal, and the GitHub CLI.

## Accessing JupyterHub

```
https://notebooks.nstsdc.org
```

Click "Sign in with GitHub." The first time, GitHub will ask you to authorize the NST Notebooks app.

## What you get

Each user gets an isolated Jupyter environment with:

- **JupyterLab** — the notebook interface
- **Python** with scientific computing libraries (NumPy, SciPy, Pandas, Matplotlib, etc.)
- **Terminal** — a full bash shell inside the container
- **GitHub CLI** (`gh`) — authenticate and interact with repos from the terminal
- **Git** — version control from the terminal or notebook
- **nano** — text editor
- **A welcome notebook** — opens automatically on first login

### Resource limits

| Resource | Guarantee | Limit |
|---|---|---|
| CPU | 1 core | 2 cores |
| Memory | 1 GB | 4 GB |

### Important: storage is ephemeral

There is no persistent storage. When your server shuts down, your files are gone. This is intentional:

- It forces you to use Git as your source of truth
- It prevents storage from filling up across hundreds of users
- It keeps the cluster clean

**Save your work to GitHub before your server shuts down.** Use the terminal:

```bash
gh auth login
git init
git add .
git commit -m "save work"
gh repo create my-notebook --private --source=. --push
```

### Idle timeout

Servers that are idle for 15 minutes are automatically stopped. This frees resources for other users. You can start a new server by visiting the hub URL again — it takes about 30 seconds.

## How it was set up

### Helm chart

JupyterHub is deployed using the official [Zero to JupyterHub](https://z2jh.jupyter.org/) Helm chart.

```bash
helm repo add jupyterhub https://jupyterhub.github.io/helm-chart/
helm repo update

helm upgrade --install jhub jupyterhub/jupyterhub \
  --namespace notebooks \
  -f config.yaml \
  -f secrets.yaml
```

### Key configuration

**Authentication:** GitHub OAuth with auto-login and open access (any GitHub account can log in).

**Scheduling:** User notebook servers run only on worker nodes (labeled `role=compute`). The control plane is excluded.

**Culling:** Idle servers are stopped after 15 minutes. The culler checks every 60 seconds.

**Admin users:** Can view and manage all user servers through the JupyterHub admin panel at `notebooks.nstsdc.org/hub/admin`.

### Custom Docker image

The default Jupyter image did not include the GitHub CLI, so a custom image was built:

**Repository:** [github.com/nst-sdc/nst-jupyter](https://github.com/nst-sdc/nst-jupyter)
**Image:** `ghcr.io/krushndayshmookh/nst-jupyter:2026-01-14`

Based on `quay.io/jupyter/scipy-notebook:latest`, it adds:
- `git`
- `gh` (GitHub CLI)
- `nano`
- `openssh-client`
- A starter notebook at `/opt/jupyter-starter/`

### Building and pushing the image

```bash
cd nst-jupyter/image

docker buildx build \
  --platform linux/amd64 \
  -t ghcr.io/krushndayshmookh/nst-jupyter:2026-01-14 \
  --push \
  .
```

### Ingress

```yaml
ingress:
  enabled: true
  ingressClassName: traefik
  hosts:
    - notebooks.nstsdc.org
```

Traefik handles the routing. Cloudflare provides edge TLS.

## Admin tasks

### View all running user servers

```bash
kubectl -n notebooks get pods
```

User server pods are named `jupyter-<github-username>`.

### Stop a specific user's server

Through the JupyterHub admin panel (`/hub/admin`) or:

```bash
kubectl -n notebooks delete pod jupyter-<username>
```

### Upgrade JupyterHub

Edit `config.yaml` or `secrets.yaml`, then:

```bash
helm upgrade jhub jupyterhub/jupyterhub \
  --namespace notebooks \
  -f config.yaml \
  -f secrets.yaml
```

### Update the notebook image

1. Build and push a new image tag
2. Update the `singleuser.image.tag` in `config.yaml`
3. Run `helm upgrade` as above
4. Existing running servers keep the old image until they are stopped and restarted
