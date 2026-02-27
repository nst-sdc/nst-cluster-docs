# Aspirations

This cluster is not a finished product. It is a foundation. Here is what it can become.

## Multi-tenant hosting platform

The current setup requires SSH access or NST Init to deploy apps. The vision is a self-service platform where any NST student can:

1. Push code to a GitHub repository
2. The platform detects it, builds a container image, and deploys it
3. The app gets a public URL automatically
4. Logs, metrics, and resource usage are visible in a dashboard

Think Vercel or Railway, but running on your own hardware. Students would learn not just how to use such a platform, but how to build one — because they built it.

## GitOps-driven deployments

Fleet is already installed. The next step is connecting student repositories so that pushing to `main` triggers an automatic deployment. No more SSH-ing in and running kubectl. The Git repository becomes the single source of truth.

This teaches a workflow that is standard in industry: infrastructure as code, declarative deployments, and automated reconciliation.

## Monitoring and observability

The cluster currently has no centralized monitoring. Adding Prometheus and Grafana would provide:

- Real-time dashboards showing cluster health, resource usage, and pod status
- Alerting when nodes go down or resources run low
- Historical data for capacity planning

Students interested in SRE (Site Reliability Engineering) could build and maintain this stack.

## CI/CD pipelines

The container registry is in place. The next step is building CI/CD pipelines that:

1. Run tests on every pull request
2. Build container images automatically
3. Push to the cluster registry
4. Deploy to a staging environment
5. Promote to production on merge

This could use GitHub Actions, Tekton (Kubernetes-native CI), or Drone CI (self-hosted).

## LLM and AI workloads

No GPUs yet, but the cluster could support:

- **CPU-based inference** for smaller models (quantized LLMs, embeddings)
- **STT/TTS pipelines** — speech-to-text and text-to-speech using Whisper and similar models
- **Batch processing** for AI experiments and training data preparation

Adding even one GPU node would open up:
- Stable Diffusion (already experimented with ComfyUI)
- Fine-tuning small language models
- Real-time inference APIs for student projects

## Distributed computing lab

The cluster is a natural fit for teaching distributed systems concepts:

- Map-reduce style workloads across nodes
- Distributed databases (CockroachDB, Cassandra)
- Message queues (Kafka, RabbitMQ)
- Service mesh (Istio, Linkerd)
- Chaos engineering — intentionally breaking things to test resilience

## Edge computing and IoT

With Raspberry Pi nodes or similar edge devices, the cluster could extend to:

- IoT data collection and processing
- Edge ML inference
- Sensor networks with central aggregation
- Campus-wide distributed systems

## Internal developer tools

- **Gitea or Forgejo** — self-hosted Git (replace dependency on GitHub)
- **Minio** — S3-compatible object storage
- **Vault** — secrets management
- **Harbor** — enterprise container registry with vulnerability scanning
- **Argo Workflows** — Kubernetes-native workflow engine

## Student-run infrastructure

The long-term aspiration is that students own and operate this cluster. Not just deploy apps on it, but:

- Perform maintenance and upgrades
- Add new nodes and services
- Write documentation and runbooks
- Respond to incidents
- Mentor incoming cohorts

This transforms the cluster from a teaching tool into a living project that teaches infrastructure, operations, teamwork, and institutional knowledge transfer.

## Hardware expansion

Current capacity: 5 nodes, 48 GB RAM, no GPUs.

Possible growth paths:
- Add more worker nodes (8-16 GB each)
- Add a GPU node for AI/ML workloads
- Add NAS/SAN for shared storage
- Add a dedicated monitoring node
- Build a high-availability control plane (3 server nodes)

## What you can do today

You do not need to wait for any of this to be built. Pick something from this list and start building it. The cluster is yours.
