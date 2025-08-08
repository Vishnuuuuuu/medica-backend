# Deployment Guide

This guide covers deploying the Healthcare Shift Logging Backend to various platforms.

## Railway Deployment (Recommended)

Railway provides excellent PostgreSQL integration and automatic deployments.

### 1. Setup Railway Project

1. Visit [railway.app](https://railway.app) and create an account
2. Click "New Project" > "Deploy from GitHub repo"
3. Connect your GitHub repository
4. Select the backend folder as the root directory

### 2. Add PostgreSQL Database

1. In your Railway project, click "New" > "Database" > "PostgreSQL"
2. Railway will automatically create a database and provide connection details
3. The `DATABASE_URL` will be automatically injected as an environment variable

### 3. Configure Environment Variables

In Railway's dashboard, go to your service and add these environment variables:

```env
NODE_ENV=production
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_AUDIENCE=your-api-identifier
AUTH0_ISSUER=https://your-auth0-domain.auth0.com/
FRONTEND_URL=https://your-frontend-domain.com
```

### 4. Deploy

1. Railway automatically deploys on every push to your main branch
2. After deployment, run database commands:
   ```bash
   railway run npx prisma db push
   railway run npx prisma db seed
   ```

### 5. Custom Domain (Optional)

1. In Railway dashboard, go to Settings > Domains
2. Add your custom domain and configure DNS

## Heroku Deployment

### 1. Setup

```bash
# Install Heroku CLI and login
heroku login

# Create app
heroku create your-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev
```

### 2. Configure Environment Variables

```bash
heroku config:set NODE_ENV=production
heroku config:set AUTH0_DOMAIN=your-auth0-domain.auth0.com
heroku config:set AUTH0_AUDIENCE=your-api-identifier
heroku config:set AUTH0_ISSUER=https://your-auth0-domain.auth0.com/
heroku config:set FRONTEND_URL=https://your-frontend-domain.com
```

### 3. Deploy

```bash
# Deploy to Heroku
git push heroku main

# Run database setup
heroku run npx prisma db push
heroku run npx prisma db seed
```

## Vercel Deployment

### 1. Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### 2. Database

Since Vercel is serverless, use a hosted PostgreSQL service:
- **Supabase**: Free tier with PostgreSQL
- **PlanetScale**: MySQL alternative
- **Neon**: Serverless PostgreSQL

### 3. Environment Variables

Add in Vercel dashboard or via CLI:

```bash
vercel env add NODE_ENV production
vercel env add DATABASE_URL your-database-url
vercel env add AUTH0_DOMAIN your-auth0-domain.auth0.com
# ... add all required variables
```

## Docker Deployment

### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 4000

# Start application
CMD ["npm", "start"]
```

### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/healthcare_shifts
      - AUTH0_DOMAIN=your-auth0-domain.auth0.com
      - AUTH0_AUDIENCE=your-api-identifier
      - AUTH0_ISSUER=https://your-auth0-domain.auth0.com/
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=healthcare_shifts
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### 3. Deploy

```bash
# Build and run
docker-compose up -d

# Run database setup
docker-compose exec app npx prisma db push
docker-compose exec app npx prisma db seed
```

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port (default: 4000) | No |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `AUTH0_DOMAIN` | Auth0 domain | Yes |
| `AUTH0_AUDIENCE` | Auth0 API identifier | Yes |
| `AUTH0_ISSUER` | Auth0 issuer URL | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | Production only |

## Post-Deployment Checklist

1. ✅ Verify database connection
2. ✅ Test GraphQL endpoint (`/graphql`)
3. ✅ Check health endpoint (`/health`)
4. ✅ Verify Auth0 JWT validation
5. ✅ Test all GraphQL queries and mutations
6. ✅ Confirm CORS settings for frontend
7. ✅ Monitor logs for any errors

## Monitoring and Logs

### Railway
- View logs in Railway dashboard
- Set up log drains for external monitoring

### Heroku
```bash
# View recent logs
heroku logs --tail

# View specific app logs
heroku logs --app your-app-name
```

### Production Health Checks

Monitor these endpoints:
- `GET /health` - Basic health check
- `POST /graphql` with introspection query
- Database connectivity via Prisma

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify `DATABASE_URL` format
   - Check firewall settings
   - Ensure database is running

2. **Auth0 JWT Validation Fails**
   - Verify Auth0 domain and audience
   - Check JWT token format
   - Confirm Auth0 application settings

3. **CORS Errors**
   - Update `FRONTEND_URL` environment variable
   - Check origin configuration in production

4. **Prisma Client Issues**
   - Run `npx prisma generate` after deployment
   - Verify database schema is up to date

### Performance Optimization

1. **Database Indexing**
   - Add indexes for frequently queried fields
   - Monitor query performance

2. **Caching**
   - Implement Redis for session caching
   - Cache frequently accessed data

3. **Rate Limiting**
   - Add rate limiting middleware
   - Monitor API usage patterns
