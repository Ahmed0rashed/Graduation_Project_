# Fly.io Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Prerequisites
- Install [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Login to Fly.io: `fly auth login`

### 2. Set Environment Variables
Set all your environment variables in Fly.io:

```bash
# Database
fly secrets set DATABASE="your-mongodb-connection-string"

# JWT
fly secrets set JWT_SECRET="your-jwt-secret"

# Google OAuth
fly secrets set GOOGLE_CLIENT_ID="your-google-client-id"
fly secrets set GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Cloudinary
fly secrets set CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
fly secrets set CLOUDINARY_API_KEY="your-cloudinary-key"
fly secrets set CLOUDINARY_API_SECRET="your-cloudinary-secret"

# Paymob
fly secrets set PAYMOB_API_KEY="your-paymob-key"
fly secrets set PAYMOB_INTEGRATION_ID="your-integration-id"
fly secrets set PAYMOB_IFRAME_ID="your-iframe-id"
fly secrets set PAYMOB_ADMIN_ID="your-admin-id"

# Gemini AI
fly secrets set GEMINI_API_KEY="your-gemini-key"

# Email
fly secrets set EMAIL_USER="your-email"
fly secrets set EMAIL_PASS="your-email-password"

# Stripe
fly secrets set STRIPE_SECRET_KEY="your-stripe-key"

# Rate Limiting
fly secrets set RATE_LIMIT_WINDOW_MS="900000"
fly secrets set RATE_LIMIT_MAX_REQUESTS="100"
fly secrets set AUTH_RATE_LIMIT_WINDOW_MS="900000"
fly secrets set AUTH_RATE_LIMIT_MAX_REQUESTS="5"
fly secrets set STRICT_RATE_LIMIT_WINDOW_MS="900000"
fly secrets set STRICT_RATE_LIMIT_MAX_REQUESTS="3"
```

### 3. Deploy to Fly.io
```bash
# Deploy the application
fly deploy

# Check deployment status
fly status

# View logs
fly logs
```

### 4. Verify Deployment
```bash
# Check if the app is running
fly status

# Test health endpoint
curl https://your-app-name.fly.dev/health
```

## 🔧 Configuration Files

### Dockerfile
- Uses Node.js 18 Alpine for smaller image size
- Runs as non-root user for security
- Includes health check
- Optimized for production

### fly.toml
- Configured for production environment
- Health check endpoint configured
- Auto-scaling enabled
- HTTPS forced

### Environment Variables
All sensitive data is stored as Fly.io secrets, not in the codebase.

## 🚨 Troubleshooting

### Common Issues:

1. **Port Issues**
   - Ensure your app listens on `0.0.0.0:PORT`
   - Check that PORT environment variable is set

2. **Database Connection**
   - Verify MongoDB connection string
   - Check if MongoDB allows connections from Fly.io IPs

3. **Environment Variables**
   - Use `fly secrets list` to check set secrets
   - Use `fly secrets set KEY=value` to set new secrets

4. **Health Check Failures**
   - Ensure `/health` endpoint returns 200 status
   - Check application logs with `fly logs`

### Useful Commands:
```bash
# View app logs
fly logs

# SSH into the machine
fly ssh console

# Check app status
fly status

# Scale the app
fly scale count 2

# View secrets
fly secrets list
```

## 📊 Monitoring

The application includes:
- Health check endpoint at `/health`
- Proper error handling
- Graceful shutdown
- Connection pooling for database
- Rate limiting protection

## 🔒 Security Features

- Non-root user in Docker container
- Environment variables as secrets
- Rate limiting on all endpoints
- HTTPS enforcement
- Input validation and sanitization
