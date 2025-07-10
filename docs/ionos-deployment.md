# Deploying to IONOS Hosting

## Prerequisites
- IONOS hosting account with Node.js support
- Node.js version 18+ enabled on your hosting plan
- Domain or subdomain configured in IONOS

## Configuration Steps

### 1. Next.js Configuration
Add or modify `next.config.js`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['live.staticflickr.com'] // Add your Flickr domain
  },
}

module.exports = nextConfig
```

### 2. Server Configuration
1. Create a `ecosystem.config.js` file for PM2:
```js
module.exports = {
  apps: [
    {
      name: 'photo-gallery',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      env: {
        PORT: 3000,
        NODE_ENV: 'production',
      },
    },
  ],
}
```

### 3. Build Process
1. Add production script to `package.json`:
```json
{
  "scripts": {
    "start": "next start",
    "build": "next build"
  }
}
```

### 4. IONOS Deployment

#### Node.js Hosting Setup
1. Log into IONOS Control Panel
2. Navigate to Hosting > Node.js
3. Create new Node.js project
4. Note down the provided:
   - SSH access details
   - Node.js version
   - Environment variables configuration

#### Deployment Steps
1. Connect via SSH to your IONOS server
2. Clone your repository:
```bash
git clone <your-repo-url>
cd <your-project>
```
3. Install dependencies and build:
```bash
npm install
npm run build
```
4. Start the application with PM2:
```bash
pm2 start ecosystem.config.js
```

### 5. Environment Variables
1. Set up your environment variables in IONOS:
   - FLICKR_API_KEY
   - FLICKR_API_SECRET
   - Any other required env vars

### 6. Domain Configuration
1. In IONOS control panel, configure reverse proxy:
   - Source: yourdomain.com
   - Target: localhost:3000
2. Set up SSL certificate
3. Configure firewall rules if necessary

### 7. Post-Deployment Checks
1. Verify all images load correctly
2. Test API endpoints
3. Check responsive design
4. Verify SSL certificate
5. Test navigation and routing

## Troubleshooting

### Common Issues
1. **Port Binding**: Ensure the application is running on the correct port
2. **Node Version**: Verify Node.js version matches requirements
3. **Process Manager**: Check PM2 logs for application errors
4. **API Errors**: Verify environment variables and API access
5. **Memory Limits**: Monitor Node.js memory usage

### Support
- IONOS Node.js Hosting Docs: https://www.ionos.com/help/hosting/nodejs/
- Next.js Deployment Docs: https://nextjs.org/docs/deployment

## Maintenance
- Regular updates via SSH or automatic deployment
- Monitor SSL certificate expiration
- Keep dependencies updated
- Regular backup of deployment configuration
