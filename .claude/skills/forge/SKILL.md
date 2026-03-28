---
name: forge
description: Manage Laravel Forge servers, sites, deployments, environment variables, SSL, daemons, scheduled jobs, and nginx config via the Forge REST API. Use when the user wants to deploy, check deployment status, manage .env, or perform any Forge server/site operation.
origin: custom
---

# Laravel Forge

Manage Laravel Forge infrastructure via the REST API (`curl`) or `forge-cli`.

## When to Activate

- User wants to deploy a site or check deployment status/logs
- User wants to view/edit `.env` variables on a Forge-managed server
- User wants to manage SSL certificates, daemons, cron jobs, nginx config
- User mentions "forge" in the context of server management
- User shares a `forge.laravel.com` URL

## Configuration

### API Token

The skill requires a Forge API token. Check for it in this order:

1. Environment variable: `FORGE_API_TOKEN`
2. Ask the user to provide it (generated at Forge Dashboard > Account > API Tokens)

Store the base URL and headers as variables for reuse:

```bash
FORGE_API="https://forge.laravel.com/api/v1"
FORGE_TOKEN="${FORGE_API_TOKEN}"
```

Every request MUST include:
```
Authorization: Bearer $FORGE_TOKEN
Accept: application/json
Content-Type: application/json
```

### Parsing Forge URLs

When the user provides a Forge URL like:
```
https://forge.laravel.com/{username}/{server-name}/{serverId}/deployments
```

Extract the `serverId` from the URL path (the numeric segment). You still need the `siteId` — list sites on that server to find it.

## API Reference

### Servers

```bash
# List all servers
curl -s "$FORGE_API/servers" -H "Authorization: Bearer $FORGE_TOKEN" -H "Accept: application/json" | jq '.servers[] | {id, name, ip_address, type, provider}'

# Get server details
curl -s "$FORGE_API/servers/$SERVER_ID" -H "Authorization: Bearer $FORGE_TOKEN" -H "Accept: application/json" | jq '.server'

# Reboot server (DANGEROUS - confirm with user first)
curl -s -X POST "$FORGE_API/servers/$SERVER_ID/reboot" -H "Authorization: Bearer $FORGE_TOKEN" -H "Accept: application/json"
```

### Sites

```bash
# List sites on a server
curl -s "$FORGE_API/servers/$SERVER_ID/sites" -H "Authorization: Bearer $FORGE_TOKEN" -H "Accept: application/json" | jq '.sites[] | {id, name, directory, repository, deployment_status}'

# Get site details
curl -s "$FORGE_API/servers/$SERVER_ID/sites/$SITE_ID" -H "Authorization: Bearer $FORGE_TOKEN" -H "Accept: application/json" | jq '.site'
```

### Deployments

```bash
# Trigger deployment
curl -s -X POST "$FORGE_API/servers/$SERVER_ID/sites/$SITE_ID/deployment/deploy" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json"

# Get latest deployment log
curl -s "$FORGE_API/servers/$SERVER_ID/sites/$SITE_ID/deployment/log" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json"

# List deployment history
curl -s "$FORGE_API/servers/$SERVER_ID/sites/$SITE_ID/deployments" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json" | jq '.deployments[] | {id, status, commit_hash, commit_author, started_at, ended_at}'

# Get specific deployment output
curl -s "$FORGE_API/servers/$SERVER_ID/sites/$SITE_ID/deployments/$DEPLOYMENT_ID/output" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json"

# Get deployment script
curl -s "$FORGE_API/servers/$SERVER_ID/sites/$SITE_ID/deployment/script" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json"

# Update deployment script
curl -s -X PUT "$FORGE_API/servers/$SERVER_ID/sites/$SITE_ID/deployment/script" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"content": "cd /home/forge/site\ngit pull origin main\ncomposer install --no-dev\nphp artisan migrate --force\nphp artisan config:cache\nphp artisan route:cache\nphp artisan view:cache"}'

# Enable quick deploy (auto-deploy on git push)
curl -s -X POST "$FORGE_API/servers/$SERVER_ID/sites/$SITE_ID/deployment" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json"

# Disable quick deploy
curl -s -X DELETE "$FORGE_API/servers/$SERVER_ID/sites/$SITE_ID/deployment" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json"
```

### Environment Variables (.env)

```bash
# Get .env content
curl -s "$FORGE_API/servers/$SERVER_ID/sites/$SITE_ID/env" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json"

# Update .env (replaces the ENTIRE file - always GET first, modify, then PUT)
curl -s -X PUT "$FORGE_API/servers/$SERVER_ID/sites/$SITE_ID/env" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"content": "APP_NAME=MyApp\nAPP_ENV=production\n..."}'
```

**WARNING:** The .env PUT replaces the entire file. Always read the current .env first, modify the specific values, then write back the full content.

### SSL Certificates

```bash
# List certificates
curl -s "$FORGE_API/servers/$SERVER_ID/sites/$SITE_ID/certificates" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json"

# Request Let's Encrypt certificate
curl -s -X POST "$FORGE_API/servers/$SERVER_ID/sites/$SITE_ID/certificates/letsencrypt" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"domains": ["example.com", "www.example.com"]}'

# Activate certificate
curl -s -X POST "$FORGE_API/servers/$SERVER_ID/sites/$SITE_ID/certificates/$CERT_ID/activate" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json"

# Delete certificate
curl -s -X DELETE "$FORGE_API/servers/$SERVER_ID/sites/$SITE_ID/certificates/$CERT_ID" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json"
```

### Databases

```bash
# List databases
curl -s "$FORGE_API/servers/$SERVER_ID/databases" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json"

# Create database
curl -s -X POST "$FORGE_API/servers/$SERVER_ID/databases" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"name": "my_database", "user": "my_user", "password": "secret"}'

# Delete database (DANGEROUS - confirm with user)
curl -s -X DELETE "$FORGE_API/servers/$SERVER_ID/databases/$DB_ID" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json"
```

### Daemons (Supervisor)

```bash
# List daemons
curl -s "$FORGE_API/servers/$SERVER_ID/daemons" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json"

# Create daemon
curl -s -X POST "$FORGE_API/servers/$SERVER_ID/daemons" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"command": "php /home/forge/site/artisan queue:work --sleep=3 --tries=3", "user": "forge", "directory": "/home/forge/site", "processes": 1, "startsecs": 1}'

# Restart daemon
curl -s -X POST "$FORGE_API/servers/$SERVER_ID/daemons/$DAEMON_ID/restart" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json"

# Delete daemon
curl -s -X DELETE "$FORGE_API/servers/$SERVER_ID/daemons/$DAEMON_ID" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json"
```

### Scheduled Jobs (Cron)

```bash
# List jobs
curl -s "$FORGE_API/servers/$SERVER_ID/jobs" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json"

# Create job
curl -s -X POST "$FORGE_API/servers/$SERVER_ID/jobs" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"command": "php /home/forge/site/artisan schedule:run", "frequency": "minutely", "user": "forge"}'

# Delete job
curl -s -X DELETE "$FORGE_API/servers/$SERVER_ID/jobs/$JOB_ID" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json"
```

Frequency values: `minutely`, `hourly`, `nightly`, `weekly`, `monthly`, `reboot`, `custom`.

### Nginx Configuration

```bash
# Get nginx config
curl -s "$FORGE_API/servers/$SERVER_ID/sites/$SITE_ID/nginx" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json"

# Update nginx config (replaces entire config - GET first, modify, PUT back)
curl -s -X PUT "$FORGE_API/servers/$SERVER_ID/sites/$SITE_ID/nginx" \
  -H "Authorization: Bearer $FORGE_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"content": "server { ... }"}'
```

## Workflow Patterns

### Deploy and Watch

```bash
# 1. Trigger deployment
curl -s -X POST "$FORGE_API/servers/$SERVER_ID/sites/$SITE_ID/deployment/deploy" \
  -H "Authorization: Bearer $FORGE_TOKEN" -H "Accept: application/json"

# 2. Check site status for deployment_status
curl -s "$FORGE_API/servers/$SERVER_ID/sites/$SITE_ID" \
  -H "Authorization: Bearer $FORGE_TOKEN" -H "Accept: application/json" | jq '.site.deployment_status'
# null = idle, "deploying" = in progress

# 3. Once done, check deployment log
curl -s "$FORGE_API/servers/$SERVER_ID/sites/$SITE_ID/deployment/log" \
  -H "Authorization: Bearer $FORGE_TOKEN" -H "Accept: application/json"
```

### Safe .env Update

```bash
# 1. Read current .env
CURRENT_ENV=$(curl -s "$FORGE_API/servers/$SERVER_ID/sites/$SITE_ID/env" \
  -H "Authorization: Bearer $FORGE_TOKEN" -H "Accept: application/json")

# 2. Show user current values, confirm changes

# 3. Write updated .env (full content)
curl -s -X PUT "$FORGE_API/servers/$SERVER_ID/sites/$SITE_ID/env" \
  -H "Authorization: Bearer $FORGE_TOKEN" -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d "{\"content\": \"$UPDATED_ENV\"}"
```

## Safety Rules

- **Server reboot**: ALWAYS confirm with user before executing
- **Database delete**: ALWAYS confirm with user before executing
- **Site delete**: ALWAYS confirm with user before executing
- **.env update**: ALWAYS read current .env first, show diff to user, then write
- **Nginx update**: ALWAYS read current config first, show diff to user, then write
- **Deployment script update**: ALWAYS show current script and proposed changes before writing
- **Deploy**: Safe to execute when user explicitly requests it

## Rate Limiting

Forge allows ~30 requests/minute per token. Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`. If you get `HTTP 429`, wait before retrying.

## Forge CLI Alternative

If `forge-cli` is installed (`composer global require laravel/forge-cli`):

```bash
forge login                          # Auth with API token
forge server:list                    # List servers
forge site:list {server}             # List sites
forge deploy {server} {site}         # Deploy
forge deploy:log {server} {site}     # Deployment log
forge env:get {server} {site}        # Get .env
forge env:set {server} {site}        # Set .env
forge nginx:get {server} {site}      # Get nginx config
forge daemon:list {server}           # List daemons
forge job:list {server}              # List cron jobs
forge certificate:list {server} {site}  # List SSL certs
```
