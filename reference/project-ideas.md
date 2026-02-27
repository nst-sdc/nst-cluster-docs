# Project Ideas

A curated list of projects for NST students. Some are standalone applications, others are designed to run on the compute cluster. Pick one that matches your interest and skill level — or propose your own.

## Web Applications and Tools

### Email Service
Build a self-hosted email system. Understand SMTP, IMAP, DNS records (MX, SPF, DKIM), spam filtering, and mailbox storage. Harder than it sounds.

### Medium Clone (Blog Platform)
A full-stack blogging platform with rich text editing, user accounts, comments, and a recommendation feed. Good exercise in content management, authentication, and full-text search.

### Online Code Judge
Accept code submissions, run them in sandboxed containers against test cases, and return results. Requires container isolation, time/memory limits, and queue management. A natural fit for the cluster.

### API Testing Tool (Postman-lite)
A browser-based tool for constructing and sending HTTP requests, viewing responses, organizing collections, and sharing them. Think Postman but lighter and self-hosted.

### URL Monitoring and Uptime Checker
A service that periodically pings URLs and tracks uptime, response time, and status codes. Sends alerts on downtime. Good for learning about scheduling, notifications, and time-series data.

### Code Screenshot Generator
Paste code, get a styled image. Syntax highlighting, theme selection, font options, export as PNG/SVG. Think Carbon or Ray.so.

### Markdown-to-Slides Generator
Write slides in Markdown, present them in the browser. Transitions, themes, speaker notes, export to PDF.

### Static Site Generator with Markdown
Build a tool that takes a directory of Markdown files and produces a static website. Templating, asset pipeline, live reload during development.

### Web-based Database GUI
Connect to PostgreSQL, MySQL, or MongoDB through a browser UI. Browse tables, run queries, view results, export data.

### Draw DB Clone
A browser-based database schema designer. Drag-and-drop tables, define relationships, export as SQL DDL or ERD diagrams.

### Web-based File Diff and Merge Tool
Upload or paste two files, see a side-by-side diff, resolve conflicts, and merge. Useful for understanding diff algorithms.

### Host Terminal on Web
A web-based terminal emulator that connects to a server via WebSocket. Think xterm.js with a backend shell session.

### File Manager for the Web
Browse, upload, download, rename, and organize files through a web UI. Think a simplified version of Finder or Nautilus in the browser.

## Creative and Visual

### Excalidraw-like Drawing App
A collaborative whiteboard with hand-drawn style shapes. Real-time sync between users, export as PNG/SVG.

### SVG Waves
A generator for decorative SVG wave patterns. Customizable colors, layers, amplitude, and frequency. Export as SVG or CSS.

### Coolors.co Clone
A color palette generator. Lock colors you like, generate complementary ones, export palettes, extract colors from images.

### Gradient Generator
Create CSS gradients visually. Linear, radial, conic. Multiple stops, angle control, copy CSS output.

### Photo Booth
Capture images from the webcam, apply filters (grayscale, sepia, blur, contrast), crop, and export. All in the browser using Canvas API.

### SVG Animator
A tool for creating SVG animations visually. Keyframes, easing functions, path animation, timeline editor, export as animated SVG or CSS.

### Procedurally Generated Landforms (2D and 3D)
Use noise functions (Perlin, Simplex) to generate terrain. Render in 2D as maps or in 3D using WebGL/Three.js. Adjustable parameters for mountains, valleys, rivers.

### particles.js-like Fun Library
A JavaScript library for creating particle effects. Configurable physics, interactions, and rendering. Publish as an npm package.

### p5.js-like Looping Renderer
A DOM-based creative coding framework with a `setup()` and `draw()` loop. Focus on programmatic animations without Canvas — pure DOM manipulation.

### Music Generator
Algorithmic music generation. Define rules for melody, harmony, and rhythm. Output MIDI or audio. Web Audio API for real-time playback.

### Music Programming Language
Design a DSL (domain-specific language) for composing music. Parse it, generate audio. Think Sonic Pi but as a language you design from scratch.

### GUI Toolkit for Web (like dat.gui)
A lightweight JavaScript library for creating control panels. Sliders, color pickers, toggles, folders. Useful for creative coding and demos.

## Games

### Tetris
The classic. Implement it properly: rotation system, wall kicks, scoring, levels, and increasing speed. Browser-based.

### Pokemon Game (Open World)
A 2D open-world game with Pokemon-style mechanics. Tile-based maps, NPC interactions, turn-based battles, inventory system.

### Shasn The Game
A digital adaptation of the political strategy board game. Multiplayer, game state management, and rule enforcement.

### Mario Platformer
A side-scrolling platformer with physics, level design, enemies, and power-ups. Good exercise in game loops, collision detection, and sprite animation.

## System-Level and Hardware

### VPN Service
Build a VPN server and client. Understand tunneling protocols, encryption, routing, and network namespaces.

### Video Optimization Pipeline
A service that accepts video uploads, transcodes them to multiple resolutions and formats, generates thumbnails, and serves them via adaptive streaming (HLS/DASH).

### Image Optimizer
Upload images, automatically compress and resize them for web delivery. Support WebP/AVIF output, batch processing, API access.

### Rufus-like Disk Image Writer
A tool for writing OS images to USB drives. Cross-platform, with verification, progress tracking, and partition management.

### Gesture-Based Computer Control
Use a webcam to detect hand gestures and translate them into mouse movements, clicks, and keyboard shortcuts. OpenCV or MediaPipe.

### Gesture-Based Home Automation
Extend gesture detection to control IoT devices. Integrate with smart home protocols (MQTT, Zigbee).

### Anydesk Clone
A remote desktop application. Screen capture, input forwarding, low-latency streaming. Understanding of video codecs, networking, and NAT traversal.

### Custom Linux Desktop Environment
Build a window manager and desktop shell from scratch on Linux. Window placement, taskbar, application launcher, wallpaper, notifications.

### Operating System
Write a minimal OS from scratch. Bootloader, kernel, memory management, process scheduling, filesystem, shell. Start with x86 or RISC-V.

### Offline-First Notes App
A note-taking app that works without internet. Sync when connectivity returns. Conflict resolution, CRDTs or operational transforms.

### Image-Based Plant Disease Detection
Train a model to identify plant diseases from leaf photos. Mobile-friendly UI for farmers. Model training, image preprocessing, deployment as an API.

### TinkerCad Clone
A browser-based 3D modeling tool. Primitive shapes, boolean operations, export as STL for 3D printing. WebGL rendering.

### Farm Automation
Sensor monitoring (soil moisture, temperature, humidity), automated irrigation, data logging, dashboard. Combines hardware (Arduino/Pi) with backend systems.

### Peer-to-Peer File Sharing Network
Implement a BitTorrent-like protocol. File chunking, peer discovery, distributed hash table, piece verification.

### Automatic Inclination Detection / Auto Drive Assist
Detect road inclination using sensors (accelerometer, gyroscope) and assist driving decisions. Hardware + software integration.

### Quick Recipes from Fridge Items
Photograph the contents of your fridge, identify ingredients (computer vision), and suggest recipes. API integration with recipe databases.

### HL System Design Simulator
A visual tool for designing and simulating distributed systems. Draw components (load balancers, databases, caches, queues), simulate traffic, observe behavior under load and failure.

### Browser-Based OS Simulator
Simulate an operating system in the browser. Process management, filesystem, terminal, windowed applications. Educational tool for OS concepts.

## NST Forum
A campus-wide discussion forum. Categories, threads, voting, moderation, user profiles. The NST equivalent of a Stack Overflow or Discourse instance.

---

## Projects for the Compute Cluster

These are specifically designed to run on and take advantage of the NST Compute Cluster infrastructure.

### Mini Cloud Platform

Not a UI. Not a deploy tool. An actual cloud platform — think a simplified AWS.

The hard questions you will need to answer:
- How do you isolate users from each other?
- How do you enforce resource quotas?
- How do you manage multi-tenancy?
- How do you expose apps to the internet safely?
- How do you handle node failures?
- What does "platform" even mean at the infrastructure level?

This is a capstone-level project. It touches every layer of the stack: networking, storage, compute, security, and API design.

### Self-Service App Hosting Portal

Think Vercel, but built by you, running on the cluster.

A frontend and API that lets users:
- Deploy apps from Git repositories
- Review deployments before promoting them
- Roll back to previous versions
- View logs and metrics
- Audit who changed what and when

### Distributed Job Queue and Worker System

A system for submitting long-running tasks (video processing, ML training, data crunching) and distributing them across cluster nodes. Job prioritization, retries, progress tracking, and result collection.

### Fault-Tolerant Key-Value Store

Build a distributed key-value store (like a simplified Redis cluster). Data replication across nodes, consistency guarantees, failure detection, automatic failover.

Requires understanding of: consensus algorithms (Raft), replication, partitioning, and network failures.

### Distributed Configuration and Secrets System

A centralized service for storing and distributing configuration and secrets to applications. Versioning, access control, encryption at rest, change notifications.

### Cluster-Wide Scheduler

Build a simplified version of the Kubernetes scheduler. Accept workload definitions, decide which node to place them on based on resource availability and constraints, handle node failures.

### Internal Developer Platform

A unified portal for all developer tools and services. User management, project creation, resource provisioning, documentation hosting. Think Backstage or a simplified Salesforce/Odoo for developers.

### Platform Observability Stack

Build a complete monitoring system:
- **Metrics:** Collect and store time-series data (CPU, memory, request rates)
- **Logs:** Aggregate logs from all pods and services
- **Traces:** Track requests across services

Dashboards, alerting, and anomaly detection.

### CI/CD System

A continuous integration and delivery pipeline that:
1. Watches Git repositories for changes
2. Runs tests in isolated containers
3. Builds container images
4. Pushes to the cluster registry
5. Deploys to staging and production environments

### Event Streaming Platform (Kafka-lite)

A distributed message broker for event-driven architectures. Topics, partitions, consumer groups, replay, exactly-once delivery. Simpler than Kafka, but distributed across cluster nodes.

### Distributed File Storage System (S3-like)

An object storage service running across cluster nodes. Upload files via API, store them distributed across nodes with replication, retrieve by key. Versioning, access control, and metadata.

### Batch Processing Engine (MapReduce-like)

Submit large data processing jobs that get split across cluster nodes, processed in parallel, and results aggregated. The classic MapReduce pattern, implemented on your own infrastructure.

### Real-Time Collaborative Editor

Like Google Docs or Google Sheets, but self-hosted. Multiple users editing the same document simultaneously. Operational transforms or CRDTs for conflict resolution, WebSocket for real-time sync.

### Multiplayer Game Server

A scalable game server infrastructure. Lobby management, matchmaking, game state synchronization, low-latency networking. Can host the Minecraft server or custom games built by other students.

### Network Chaos and Failure Simulation Tool

A tool for intentionally breaking things: inject network latency, drop packets, kill pods, simulate node failures. Used to test how other applications handle failures. Think Chaos Monkey for the NST cluster.

### System Debugging and Recovery Simulator

An educational tool that presents broken system scenarios (misconfigured networks, crashed services, full disks, certificate expiration) and lets students diagnose and fix them in a safe environment.

---

## Special Project

**Configure and create an NST Overleaf Image** — a custom Overleaf Docker image tailored for NST, with pre-installed LaTeX packages, templates, and branding.

---

Pick something. Build it. Ship it on the cluster. That is how you learn.
