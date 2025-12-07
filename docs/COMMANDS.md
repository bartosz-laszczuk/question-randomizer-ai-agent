# Commands Reference

Complete reference for all npm scripts and Docker commands.

---

## NPM Scripts

### Development Commands

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build project (TypeScript → JavaScript)
npm run build

# Start production server (must build first)
npm start

# Clean build artifacts
npm run clean
```

**Details:**

#### `npm run dev`
- Uses `nodemon` + `tsx` for hot reloading
- Watches all `.ts` files in `src/`
- Automatically restarts on file changes
- Logs to console with `debug` level

#### `npm run build`
- Compiles TypeScript to JavaScript
- Output: `dist/` directory
- Uses `tsconfig.json` configuration
- Includes type checking

#### `npm start`
- Runs compiled JavaScript from `dist/`
- **Must run `npm run build` first**
- Production mode (no hot reload)
- Uses `NODE_ENV=production` settings

---

### Testing Commands

```bash
# Run all tests (unit + integration)
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run tests with verbose output
npm run test:verbose
```

**Details:**

#### `npm test`
- Runs all tests in `tests/` directory
- Uses Jest test runner
- Parallel execution for speed
- Generates basic output

#### `npm run test:unit`
- Runs tests in `tests/unit/`
- Mocked dependencies (no real Firestore/Redis)
- Fast execution (~5-10 seconds)
- Ideal for TDD workflow

#### `npm run test:integration`
- Runs tests in `tests/integration/`
- Uses Firebase Emulator + Testcontainers Redis
- Slower execution (~30-60 seconds)
- Tests real integration with dependencies

#### `npm run test:coverage`
- Generates HTML coverage report
- Output: `coverage/lcov-report/index.html`
- Shows line/branch/function coverage
- Target: >80% overall coverage

---

### Code Quality Commands

```bash
# Run ESLint (check for linting errors)
npm run lint

# Fix auto-fixable ESLint errors
npm run lint:fix

# Run Prettier (check formatting)
npm run format:check

# Fix formatting with Prettier
npm run format

# Run TypeScript type checking
npm run type-check
```

**Details:**

#### `npm run lint`
- Checks TypeScript/JavaScript files for errors
- Uses ESLint with TypeScript parser
- Checks code style and best practices
- Exits with error if issues found

#### `npm run format`
- Formats all code with Prettier
- Applies consistent style
- Modifies files in-place
- Run before committing

#### `npm run type-check`
- Runs TypeScript compiler in check mode
- No code generation
- Reports type errors
- Faster than full build

---

### Docker Commands

```bash
# Build Docker image
docker build -t question-randomizer-agent:latest .

# Run Docker container
docker run -p 3002:3002 --env-file .env question-randomizer-agent:latest

# Run with volume mount (for development)
docker run -p 3002:3002 --env-file .env \
  -v $(pwd)/src:/app/src \
  question-randomizer-agent:latest

# Build and tag for registry
docker build -t gcr.io/PROJECT/agent-service:latest .

# Push to registry
docker push gcr.io/PROJECT/agent-service:latest
```

---

### Docker Compose Commands

```bash
# Start all services (Redis + Firebase Emulator)
docker-compose up

# Start in detached mode (background)
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View logs
docker-compose logs -f

# Restart single service
docker-compose restart redis
```

**Services:**
- **redis**: Redis server (port 6379)
- **firebase-emulator**: Firebase Emulator Suite (Firestore on port 8080)

---

### Database Commands

```bash
# Seed test data (development)
npm run seed:dev

# Clear all data (development)
npm run db:clear

# Backup Firestore data
npm run db:backup

# Restore Firestore data
npm run db:restore
```

**Note:** These scripts are in `scripts/` directory.

---

### CI/CD Commands

```bash
# Run CI pipeline locally
npm run ci

# Security audit
npm audit

# Fix security vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated

# Update packages
npm update
```

**CI Pipeline (`npm run ci`):**
1. Install dependencies
2. Run linter
3. Run type checking
4. Run tests
5. Generate coverage report
6. Build project

---

## Deployment Commands

### Google Cloud Run

```bash
# Build and deploy
gcloud run deploy agent-service \
  --source . \
  --region us-central1 \
  --platform managed

# Deploy from pre-built image
gcloud run deploy agent-service \
  --image gcr.io/PROJECT/agent-service:latest \
  --region us-central1
```

---

### Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/

# Apply specific manifest
kubectl apply -f k8s/deployment.yaml

# Check deployment status
kubectl rollout status deployment/agent-service

# View logs
kubectl logs -f deployment/agent-service

# Scale deployment
kubectl scale deployment/agent-service --replicas=5

# Delete all resources
kubectl delete -f k8s/
```

**See [k8s/README.md](../k8s/README.md) for complete Kubernetes guide.**

---

### AWS ECS

```bash
# Build and push image
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker build -t agent-service .
docker tag agent-service:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/agent-service:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/agent-service:latest

# Update ECS service
aws ecs update-service --cluster my-cluster --service agent-service --force-new-deployment
```

---

### Azure Container Instances

```bash
# Build and push image
az acr login --name myregistry
docker build -t agent-service .
docker tag agent-service:latest myregistry.azurecr.io/agent-service:latest
docker push myregistry.azurecr.io/agent-service:latest

# Deploy
az container create \
  --resource-group myResourceGroup \
  --name agent-service \
  --image myregistry.azurecr.io/agent-service:latest \
  --cpu 2 --memory 4 \
  --ports 3002
```

---

## Utility Commands

### Health Checks

```bash
# Check service health
curl http://localhost:3002/health

# Check readiness (Kubernetes)
curl http://localhost:3002/ready

# Check liveness (Kubernetes)
curl http://localhost:3002/live
```

---

### Redis Commands

```bash
# Connect to Redis CLI
redis-cli

# Check Redis connection
redis-cli ping

# View all keys
redis-cli KEYS '*'

# Monitor Redis commands
redis-cli MONITOR

# View queue jobs (BullMQ)
redis-cli KEYS 'bull:agent-tasks:*'

# Clear all Redis data (DANGEROUS)
redis-cli FLUSHALL
```

---

### Firebase Emulator Commands

```bash
# Start Firebase Emulator Suite
firebase emulators:start

# Start with seed data
firebase emulators:start --import=./firebase-seed-data

# Export data
firebase emulators:export ./firebase-export-data
```

---

## Environment-Specific Commands

### Development

```bash
# Start development environment
npm run dev

# Start with debug logging
LOG_LEVEL=debug npm run dev

# Start Redis + Firebase Emulator
docker-compose up -d
```

---

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/unit/tools/get-questions.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should filter by userId"
```

---

### Production

```bash
# Build optimized bundle
npm run build

# Start production server
NODE_ENV=production npm start

# Check production build size
du -sh dist/
```

---

## Troubleshooting Commands

### Check Versions

```bash
# Node.js version
node --version

# npm version
npm --version

# TypeScript version
npx tsc --version

# Check all dependencies
npm list
```

---

### Debug Commands

```bash
# Start with Node.js inspector
node --inspect dist/server.js

# Start with breakpoint
node --inspect-brk dist/server.js

# View environment variables
node -e "console.log(process.env)"

# Test Firestore connection
node -e "require('./dist/config/firebase.config').default"
```

---

### Clean Up Commands

```bash
# Remove node_modules
rm -rf node_modules

# Remove build artifacts
rm -rf dist coverage

# Clean npm cache
npm cache clean --force

# Reinstall everything
rm -rf node_modules package-lock.json && npm install
```

---

## Quick Reference

**Most Common Commands:**

```bash
# Development
npm run dev              # Start dev server
npm test                 # Run tests
npm run lint:fix         # Fix linting
npm run format           # Format code

# Production
npm run build            # Build project
npm start                # Start server

# Docker
docker-compose up -d     # Start services
docker-compose logs -f   # View logs

# Health Check
curl http://localhost:3002/health
```

---

**See Also:**
- [SETUP.md](./SETUP.md) - Setup guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues
