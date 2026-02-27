---
layout: home

hero:
  name: NST Compute Cluster
  # text: Student-Built Kubernetes Infrastructure
  tagline: A 5-node on-premise cluster at Newton School of Technology — built from scratch, documented for learning.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: Services
      link: /services/
    - theme: alt
      text: Reference
      link: /reference/
    - theme: alt
      text: Project Ideas
      link: /reference/project-ideas

features:
  - title: Real Infrastructure
    details: Five physical machines running Kubernetes, not a cloud sandbox. You deploy here, it runs on actual hardware sitting in the campus server room.
  - title: Public by Default
    details: Every app you deploy gets a public URL at *.nstsdc.org via Cloudflare Tunnel — no static IP, no port forwarding, no router access needed.
  - title: Learn by Building
    details: This cluster was set up step-by-step as a learning exercise. The docs walk through every decision, every mistake, and every fix.
  - title: Self-Service Deployment
    details: Use NST Init to deploy your containerized apps, or go hands-on with kubectl. JupyterHub for notebooks, Overleaf for LaTeX, Minecraft for breaks.
---
