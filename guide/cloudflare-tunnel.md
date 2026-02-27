# Cloudflare Tunnel

The Cloudflare Tunnel is how the cluster connects to the internet without a static public IP address.

## What problem it solves

Most campus networks do not give you a static public IP. Even if they do, you would need to configure NAT rules, firewall exceptions, and deal with the security implications of exposing a machine directly to the internet.

Cloudflare Tunnel flips this model. Instead of the internet connecting to you, your machine connects outward to Cloudflare. Cloudflare then proxies incoming requests back through that connection. The result:

- No static IP needed
- No port forwarding or NAT
- No firewall rules to open
- SSH, HTTP, and HTTPS all work through the same tunnel
- DDoS protection and Cloudflare's edge network for free

## How it works

1. The `cloudflared` daemon runs on nst-n1 as a systemd service
2. It establishes a persistent encrypted connection to Cloudflare's edge
3. When someone visits `whoami.nstsdc.org`, Cloudflare routes the request through the tunnel
4. `cloudflared` forwards it to the local service based on its ingress rules
5. The response goes back through the tunnel to the user

## Configuration

The tunnel config lives at `/etc/cloudflared/config.yml` on nst-n1:

```yaml
tunnel: krushn-node1
credentials-file: /etc/cloudflared/<TUNNEL_UUID>.json
origincert: /etc/cloudflared/cert.pem

ingress:
  # SSH access (exact hostname, must be first)
  - hostname: "nst-n1.nstsdc.org"
    service: ssh://localhost:22

  # Rancher (HTTPS with self-signed cert)
  - hostname: "rancher.nstsdc.org"
    service: https://localhost:443
    originRequest:
      noTLSVerify: true

  # Everything else goes to Traefik (HTTP)
  - hostname: "*.nstsdc.org"
    service: http://localhost:80

  # Catch-all
  - service: http_status:404
```

### Ingress rule ordering matters

Cloudflare Tunnel evaluates ingress rules **top to bottom**. The first matching rule wins. This means:

- Exact hostnames (like the SSH endpoint) must come **before** wildcard rules
- If the wildcard HTTP rule appears first, SSH traffic gets routed to HTTP, causing `websocket: bad handshake` errors

This is a common mistake. If SSH breaks after a config change, check the rule ordering first.

### The catch-all rule

The last rule (`service: http_status:404`) is required. It tells cloudflared what to do with requests that do not match any hostname. Without it, cloudflared refuses to start.

## Files involved

| File | Purpose | Sensitive? |
|---|---|---|
| `/etc/cloudflared/config.yml` | Tunnel routing rules | No |
| `/etc/cloudflared/<UUID>.json` | Tunnel credentials | Yes |
| `/etc/cloudflared/cert.pem` | Cloudflare origin certificate | Yes |

The credentials file and certificate are generated during tunnel creation and should not be shared or committed to version control.

## Managing the tunnel

```bash
# Check if the tunnel is running
sudo systemctl status cloudflared

# View live logs
sudo journalctl -u cloudflared -f

# Restart after config change
sudo systemctl restart cloudflared

# Edit config
sudo nano /etc/cloudflared/config.yml
```

**Warning:** Restarting cloudflared while connected via SSH through the tunnel will break your session. This is expected — the tunnel goes down briefly during restart. Simply reconnect.

## DNS setup

Cloudflare DNS records are created using the `cloudflared` CLI:

```bash
sudo cloudflared tunnel route dns krushn-node1 "*.nstsdc.org"
sudo cloudflared tunnel route dns krushn-node1 "nst-n1.nstsdc.org"
```

This creates CNAME records in Cloudflare pointing to the tunnel. You only need to run these once per hostname or wildcard.

To verify DNS is working:

```bash
dig whoami.nstsdc.org +short
dig CNAME whoami.nstsdc.org
```

## Tutorial: Adding a new hostname to the tunnel

If you want to route a new hostname through the tunnel:

1. The wildcard `*.nstsdc.org` already covers any subdomain, so you usually do not need to touch the tunnel config or DNS at all.

2. Just create a Kubernetes Ingress with the desired hostname:
   ```yaml
   spec:
     rules:
       - host: myapp.nstsdc.org
         http:
           paths:
             - path: /
               pathType: Prefix
               backend:
                 service:
                   name: myapp
                   port:
                     number: 80
   ```

3. The wildcard DNS catches it, the tunnel forwards it to Traefik, and Traefik matches the Ingress rule. Done.

The only case where you need to modify the tunnel config is if you need a non-HTTP protocol (like SSH) or special origin settings (like `noTLSVerify` for Rancher).

## Origin certificate setup

When running `cloudflared tunnel route dns` commands as root, cloudflared needs access to the origin certificate. By default, it looks in the root user's home directory, not your user's.

If you see errors about a missing `cert.pem`:

```bash
sudo cp ~/.cloudflared/cert.pem /etc/cloudflared/cert.pem
sudo chown root:root /etc/cloudflared/cert.pem
sudo chmod 600 /etc/cloudflared/cert.pem
```

Then add `origincert: /etc/cloudflared/cert.pem` to the config file.
