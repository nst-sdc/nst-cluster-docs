# Introduction

The NST Compute Cluster is a 5-node bare-metal Kubernetes cluster located at Newton School of Technology, Ajeenkya DY Patil University. It was built from scratch as both a teaching platform and a production-grade internal cloud.

## What it is

- Five physical machines (one control plane, four workers) running K3s
- Public access via Cloudflare Tunnel — no static IP needed
- Self-service app deployment for students
- Hosts JupyterHub, Overleaf, a container registry, and student projects

## Why it exists

Most students learn Kubernetes from tutorials that run on managed cloud services. Someone else provisioned the machines, configured the network, and set up the cluster. You just type `kubectl apply` and it works.

That is not how infrastructure works in the real world.

This cluster exists so you can see — and eventually operate — every layer of the stack. From the physical machines and their network configuration, through the Kubernetes control plane, all the way up to the apps running on top. Nothing is hidden, nothing is abstracted away.

## How these docs are organized

**Guide** — Narrative documentation that walks through how the cluster was built, step by step. Start here if you want to understand the system from the ground up.

**Services** — Documentation for each service running on the cluster (JupyterHub, Overleaf, NST Init, etc). Start here if you just want to use something.

**Reference** — Lookup material: command cheat sheets, file maps, namespace inventories, troubleshooting guides, and tips.

## The stack

| Component | Role |
|---|---|
| Ubuntu Server 25.10 | Operating system on all nodes |
| K3s v1.33.6 | Lightweight Kubernetes distribution |
| Traefik v3.5.1 | Ingress controller (routes HTTP traffic to apps) |
| Cloudflare Tunnel | Public access without static IP |
| Rancher v2.13.1 | Web-based cluster management UI |
| cert-manager v1.19.2 | Automatic TLS certificate management |
| Fleet v0.14.1 | GitOps continuous delivery |
| Helm | Package manager for Kubernetes |

## Quick links

| Service | URL |
|---|---|
| Rancher | [rancher.nstsdc.org](https://rancher.nstsdc.org) |
| JupyterHub | [notebooks.nstsdc.org](https://notebooks.nstsdc.org) |
| NST Init | [init.nstsdc.org](https://init.nstsdc.org) |
| Overleaf | [overleaf.nstsdc.org](https://overleaf.nstsdc.org) |
