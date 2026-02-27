import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'NST Compute Cluster',
  description: 'Documentation for the Newton School of Technology Compute Cluster',
  base: process.env.VITEPRESS_BASE || '/',
  
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Services', link: '/services/' },
      { text: 'Reference', link: '/reference/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Architecture', link: '/guide/architecture' },
            { text: 'Accessing the Cluster', link: '/guide/access' },
          ]
        },
        {
          text: 'Hardware & Network',
          items: [
            { text: 'Node Inventory', link: '/guide/nodes' },
            { text: 'Network Configuration', link: '/guide/networking' },
            { text: 'Cloudflare Tunnel', link: '/guide/cloudflare-tunnel' },
          ]
        },
        {
          text: 'Kubernetes',
          items: [
            { text: 'K3s Installation', link: '/guide/k3s-install' },
            { text: 'Multi-Node Setup', link: '/guide/multi-node' },
            { text: 'Traefik Ingress', link: '/guide/traefik' },
            { text: 'Deploying Your First App', link: '/guide/first-app' },
          ]
        },
        {
          text: 'Cluster Management',
          items: [
            { text: 'Rancher', link: '/guide/rancher' },
            { text: 'cert-manager & TLS', link: '/guide/cert-manager' },
            { text: 'Fleet (GitOps)', link: '/guide/fleet' },
            { text: 'Adding a Node', link: '/guide/adding-a-node' },
          ]
        },
        {
          text: 'Tutorials',
          items: [
            { text: 'Deploy a Web App', link: '/guide/tutorial-deploy-app' },
            { text: 'Get a Public URL', link: '/guide/tutorial-public-url' },
            { text: 'Debug a Broken Pod', link: '/guide/tutorial-debugging' },
          ]
        },
      ],

      '/services/': [
        {
          text: 'Platform Services',
          items: [
            { text: 'Overview', link: '/services/' },
            { text: 'NST Init', link: '/services/nst-init' },
            { text: 'JupyterHub', link: '/services/jupyterhub' },
            { text: 'Overleaf', link: '/services/overleaf' },
            { text: 'Container Registry', link: '/services/registry' },
          ]
        },
        {
          text: 'Fun Stuff',
          items: [
            { text: 'Minecraft Server', link: '/services/minecraft' },
          ]
        },
      ],

      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'Cheat Sheet', link: '/reference/' },
            { text: 'File Map', link: '/reference/file-map' },
            { text: 'Namespace Inventory', link: '/reference/namespaces' },
            { text: 'Helm Releases', link: '/reference/helm' },
            { text: 'Troubleshooting', link: '/reference/troubleshooting' },
            { text: 'Tips & Tricks', link: '/reference/tips' },
            { text: 'Aspirations', link: '/reference/aspirations' },
            { text: 'Project Ideas', link: '/reference/project-ideas' },
            { text: 'Credits', link: '/reference/credits' },
          ]
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/nst-sdc' }
    ],

    footer: {
      message: 'Built by students, for students.',
      copyright: 'Newton School of Technology'
    },

    search: {
      provider: 'local'
    }
  }
})
