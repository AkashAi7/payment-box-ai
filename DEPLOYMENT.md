# Deployment Guide

This guide covers deploying Payment Box AI to production environments.

## Prerequisites

- Node.js 14+ installed on server
- Domain name (for HTTPS)
- SSL/TLS certificate
- Chromium/Chrome installed (for Puppeteer)

## Production Considerations

### 1. Security Hardening

#### Enable HTTPS

```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/path/to/private.key'),
  cert: fs.readFileSync('/path/to/certificate.crt'),
};

const server = https.createServer(options, app);
server.listen(443);
```

#### Set Secure Headers

```javascript
const helmet = require('helmet');
app.use(helmet());
```

#### Configure CORS

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  methods: ['GET', 'POST'],
  credentials: true,
}));
```

### 2. Environment Variables

Create a `.env` file with production settings:

```env
NODE_ENV=production
PORT=443

# Security
SSL_KEY_PATH=/path/to/private.key
SSL_CERT_PATH=/path/to/certificate.crt
ALLOWED_ORIGINS=https://yourdomain.com

# Authentication
AUTH_EXPIRATION=300
CHALLENGE_LENGTH=32

# Sandbox
SANDBOX_TIMEOUT=300000
BROWSER_HEADLESS=true
MAX_ACTIVE_SANDBOXES=10

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

### 3. Process Management

Use PM2 for process management:

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/server.js --name payment-box-ai

# Configure auto-restart
pm2 startup
pm2 save

# Monitor
pm2 monit
```

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'payment-box-ai',
    script: './src/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }]
};
```

### 4. Reverse Proxy (Nginx)

Configure Nginx as reverse proxy:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. Database (Optional)

For persistent audit logs, use a database:

```javascript
// PostgreSQL example
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: 5432,
});

// Store audit log
async function logActionToDB(entry) {
  await pool.query(
    'INSERT INTO audit_log (timestamp, sandbox_id, action, details) VALUES ($1, $2, $3, $4)',
    [entry.timestamp, entry.sandboxId, entry.action, JSON.stringify(entry.details)]
  );
}
```

### 6. Monitoring

#### Health Checks

```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date(),
    memory: process.memoryUsage(),
  });
});
```

#### Logging

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

#### Metrics

```javascript
const prometheus = require('prom-client');

const register = new prometheus.Registry();
prometheus.collectDefaultMetrics({ register });

const sandboxCounter = new prometheus.Counter({
  name: 'sandboxes_created_total',
  help: 'Total number of sandboxes created',
  registers: [register],
});

app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});
```

## Deployment Options

### Option 1: Traditional VPS

#### DigitalOcean / Linode / Vultr

```bash
# SSH into server
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install dependencies
sudo apt-get install -y chromium-browser

# Clone repository
git clone https://github.com/AkashAi7/payment-box-ai.git
cd payment-box-ai

# Install packages
npm ci --production

# Configure environment
cp .env.example .env
nano .env

# Start with PM2
pm2 start src/server.js
```

### Option 2: Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-slim

# Install Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Start application
CMD ["node", "src/server.js"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - app
    restart: unless-stopped
```

Deploy:

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Option 3: Kubernetes

Create `deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-box-ai
spec:
  replicas: 3
  selector:
    matchLabels:
      app: payment-box-ai
  template:
    metadata:
      labels:
        app: payment-box-ai
    spec:
      containers:
      - name: payment-box-ai
        image: your-registry/payment-box-ai:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: payment-box-ai
spec:
  selector:
    app: payment-box-ai
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

Deploy:

```bash
kubectl apply -f deployment.yaml
```

### Option 4: Serverless (with limitations)

Note: Full Puppeteer may not work on all serverless platforms. Consider using Puppeteer Core with external Chrome.

```javascript
// AWS Lambda example
const serverless = require('serverless-http');
const app = require('./src/server');

module.exports.handler = serverless(app);
```

## Post-Deployment Checklist

- [ ] HTTPS enabled and working
- [ ] SSL certificate valid
- [ ] Environment variables configured
- [ ] Firewall rules configured
- [ ] Rate limiting enabled
- [ ] Monitoring setup
- [ ] Logging configured
- [ ] Backup strategy in place
- [ ] Health checks passing
- [ ] Performance tested
- [ ] Security audit completed

## Scaling

### Horizontal Scaling

Use load balancer with multiple instances:

```bash
# PM2 cluster mode
pm2 start src/server.js -i max

# Or use Kubernetes/Docker Swarm for orchestration
```

### Vertical Scaling

Increase server resources:
- CPU: 2+ cores recommended
- RAM: 4GB+ for multiple sandboxes
- Disk: SSD for better performance

### Caching

Add Redis for session/auth caching:

```javascript
const redis = require('redis');
const client = redis.createClient();

// Cache authentication challenges
async function cacheChallenge(challenge, data) {
  await client.setex(challenge, 300, JSON.stringify(data));
}
```

## Maintenance

### Updates

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm ci --production

# Restart application
pm2 restart payment-box-ai
```

### Backups

```bash
# Backup audit logs
tar -czf backup-$(date +%Y%m%d).tar.gz logs/

# Backup database (if using)
pg_dump payment_box_ai > backup-$(date +%Y%m%d).sql
```

### Monitoring

- Monitor CPU/Memory usage
- Track sandbox creation rate
- Monitor authentication failures
- Check error logs regularly
- Set up alerts for anomalies

## Troubleshooting

### Issue: Puppeteer fails to launch

```bash
# Install missing dependencies
sudo apt-get install -y \
  libnss3 libxss1 libasound2 libatk-bridge2.0-0 \
  libgtk-3-0 libgbm1
```

### Issue: High memory usage

- Limit concurrent sandboxes
- Implement cleanup routines
- Monitor for memory leaks

### Issue: Slow performance

- Enable caching
- Optimize Puppeteer settings
- Use faster storage (SSD)
- Scale horizontally

## Support

For deployment issues:
- Check logs: `pm2 logs payment-box-ai`
- Review documentation
- Open GitHub issue
- Contact support

---

**Last Updated:** February 2026  
**Version:** 1.0.0
