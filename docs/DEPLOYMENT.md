# Deployment Guide - Question Randomizer AI Agent Service

Comprehensive guide for deploying the AI Agent Service to various environments.

## Table of Contents

- [Deployment Options](#deployment-options)
- [Docker Deployment](#docker-deployment)
- [Docker Compose](#docker-compose)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Cloud Platform Guides](#cloud-platform-guides)
- [Environment Configuration](#environment-configuration)
- [Security Considerations](#security-considerations)
- [Monitoring & Observability](#monitoring--observability)
- [Troubleshooting](#troubleshooting)

---

## Deployment Options

### Quick Comparison

| Option | Complexity | Scalability | Use Case |
|--------|------------|-------------|----------|
| **Docker** | Low | Manual | Development, small deployments |
| **Docker Compose** | Low | Manual | Local development, testing |
| **Kubernetes** | High | Automatic | Production, high availability |
| **Cloud Run** (GCP) | Low | Automatic | Serverless, auto-scaling |
| **ECS/Fargate** (AWS) | Medium | Automatic | AWS-native deployments |
| **Container Instances** (Azure) | Low | Manual | Simple Azure deployments |

---

## Docker Deployment

### Prerequisites

- Docker 24+ installed
- Environment variables configured
- Firebase credentials available
- Anthropic API key

### Build Docker Image

```bash
# Navigate to project root
cd question-randomizer-ai-agent

# Build production image
docker build -t question-randomizer-agent:latest .

# Or use npm script
npm run docker:build
```

### Run Docker Container

**Basic Usage:**
```bash
docker run -d \
  --name agent-service \
  -p 3002:3002 \
  --env-file .env \
  question-randomizer-agent:latest
```

**With Volume Mounts:**
```bash
docker run -d \
  --name agent-service \
  -p 3002:3002 \
  -v $(pwd)/logs:/app/logs \
  --env-file .env \
  question-randomizer-agent:latest
```

**With Custom Network (for Redis connectivity):**
```bash
# Create network
docker network create agent-network

# Run Redis
docker run -d \
  --name redis \
  --network agent-network \
  -p 6379:6379 \
  redis:7-alpine

# Run agent service
docker run -d \
  --name agent-service \
  --network agent-network \
  -p 3002:3002 \
  -e REDIS_HOST=redis \
  --env-file .env \
  question-randomizer-agent:latest
```

### Verify Deployment

```bash
# Check container status
docker ps

# Check logs
docker logs agent-service

# Follow logs
docker logs -f agent-service

# Health check
curl http://localhost:3002/health
```

### Stop and Remove

```bash
# Stop container
docker stop agent-service

# Remove container
docker rm agent-service

# Remove image
docker rmi question-randomizer-agent:latest
```

---

## Docker Compose

### Start Services

```bash
# Start all services (agent + Redis)
docker-compose up -d

# Or use npm script
npm run docker:compose:up

# View logs
docker-compose logs -f

# Or use npm script
npm run docker:compose:logs
```

### Configuration

Edit `docker-compose.yml` to customize:
- Port mappings
- Environment variables
- Resource limits
- Network configuration

**Example .env for Docker Compose:**
```env
NODE_ENV=production
LOG_LEVEL=info
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS_JSON={"type":"service_account",...}
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
QUEUE_CONCURRENCY=3
```

### Stop Services

```bash
# Stop services
docker-compose down

# Or use npm script
npm run docker:compose:down

# Stop and remove volumes
docker-compose down -v
```

---

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.24+)
- kubectl configured
- Container registry access (e.g., Docker Hub, GHCR)
- Secrets management solution

### Step 1: Create Namespace

```bash
kubectl create namespace agent-service
```

### Step 2: Create Secrets

```bash
# Create secret from files
kubectl create secret generic agent-secrets \
  --from-file=firebase-credentials-json=./firebase-credentials.json \
  --from-literal=anthropic-api-key=sk-ant-api03-xxxxx \
  --from-literal=redis-password=your-redis-password \
  -n agent-service

# Or from literal values
kubectl create secret generic agent-secrets \
  --from-literal=firebase-credentials-json='{"type":"service_account",...}' \
  --from-literal=anthropic-api-key=sk-ant-api03-xxxxx \
  -n agent-service
```

### Step 3: Apply ConfigMap

```bash
# Edit k8s/configmap.yml with your configuration
kubectl apply -f k8s/configmap.yml -n agent-service
```

### Step 4: Deploy Redis (Optional)

```bash
# Deploy Redis if not using external Redis service
kubectl apply -f k8s/redis.yml -n agent-service

# Wait for Redis to be ready
kubectl wait --for=condition=ready pod -l app=redis -n agent-service --timeout=60s
```

### Step 5: Deploy Agent Service

```bash
# Deploy application
kubectl apply -f k8s/deployment.yml -n agent-service

# Deploy service
kubectl apply -f k8s/service.yml -n agent-service

# Deploy ingress (optional)
kubectl apply -f k8s/ingress.yml -n agent-service
```

### Step 6: Verify Deployment

```bash
# Check deployment status
kubectl get deployments -n agent-service

# Check pods
kubectl get pods -n agent-service

# Check services
kubectl get svc -n agent-service

# View logs
kubectl logs -f deployment/agent-service -n agent-service

# Port forward for testing
kubectl port-forward svc/agent-service 3002:80 -n agent-service

# Test health endpoint
curl http://localhost:3002/health
```

### Scaling

```bash
# Scale to 5 replicas
kubectl scale deployment/agent-service --replicas=5 -n agent-service

# Auto-scaling (HPA)
kubectl autoscale deployment agent-service \
  --min=3 --max=10 \
  --cpu-percent=70 \
  -n agent-service
```

### Updates and Rollbacks

```bash
# Update image
kubectl set image deployment/agent-service \
  agent-service=ghcr.io/your-org/question-randomizer-ai-agent:v1.1.0 \
  -n agent-service

# Check rollout status
kubectl rollout status deployment/agent-service -n agent-service

# Rollback to previous version
kubectl rollout undo deployment/agent-service -n agent-service

# View rollout history
kubectl rollout history deployment/agent-service -n agent-service
```

---

## Cloud Platform Guides

### Google Cloud Run

**Deploy to Cloud Run:**

```bash
# Set project
gcloud config set project YOUR_PROJECT_ID

# Build and push image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/agent-service

# Deploy to Cloud Run
gcloud run deploy agent-service \
  --image gcr.io/YOUR_PROJECT_ID/agent-service \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets FIREBASE_CREDENTIALS_JSON=firebase-creds:latest \
  --set-secrets ANTHROPIC_API_KEY=anthropic-key:latest \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 10 \
  --timeout 300s
```

**Configure Redis (Cloud Memorystore):**

```bash
# Create Redis instance
gcloud redis instances create agent-redis \
  --size=1 \
  --region=us-central1 \
  --redis-version=redis_7_0

# Get connection details
gcloud redis instances describe agent-redis --region=us-central1

# Update Cloud Run with Redis connection
gcloud run services update agent-service \
  --set-env-vars REDIS_HOST=<redis-ip> \
  --set-env-vars REDIS_PORT=6379
```

---

### AWS ECS/Fargate

**Create ECS Cluster:**

```bash
aws ecs create-cluster --cluster-name agent-service-cluster
```

**Build and Push to ECR:**

```bash
# Create ECR repository
aws ecr create-repository --repository-name agent-service

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and tag image
docker build -t agent-service .
docker tag agent-service:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/agent-service:latest

# Push to ECR
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/agent-service:latest
```

**Create Task Definition:**

```json
{
  "family": "agent-service",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "agent-service",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/agent-service:latest",
      "portMappings": [
        {
          "containerPort": 3002,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3002"}
      ],
      "secrets": [
        {
          "name": "ANTHROPIC_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:anthropic-api-key"
        },
        {
          "name": "FIREBASE_CREDENTIALS_JSON",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:firebase-creds"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/agent-service",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

**Create and Run Service:**

```bash
aws ecs create-service \
  --cluster agent-service-cluster \
  --service-name agent-service \
  --task-definition agent-service \
  --desired-count 3 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

---

### Azure Container Instances

```bash
# Create resource group
az group create --name agent-service-rg --location eastus

# Create container instance
az container create \
  --resource-group agent-service-rg \
  --name agent-service \
  --image YOUR_REGISTRY.azurecr.io/agent-service:latest \
  --cpu 2 \
  --memory 4 \
  --port 3002 \
  --environment-variables \
    NODE_ENV=production \
    PORT=3002 \
  --secure-environment-variables \
    ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
    FIREBASE_CREDENTIALS_JSON=$FIREBASE_CREDENTIALS_JSON \
  --dns-name-label agent-service
```

---

## Environment Configuration

### Production Environment Variables

```env
# Required
NODE_ENV=production
PORT=3002
FIREBASE_PROJECT_ID=your-production-project
FIREBASE_CREDENTIALS_JSON={"type":"service_account",...}
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_TLS=true

# Optional (with defaults)
LOG_LEVEL=info
QUEUE_CONCURRENCY=5
QUEUE_MAX_RETRIES=3
AGENT_TIMEOUT_MS=120000
REQUEST_TIMEOUT_MS=150000
ENABLE_REQUEST_LOGGING=true
```

### Secrets Management

**Google Cloud Secret Manager:**
```bash
# Store secret
echo -n "sk-ant-api03-xxxxx" | gcloud secrets create anthropic-api-key --data-file=-

# Access secret in Cloud Run
gcloud run services update agent-service \
  --set-secrets ANTHROPIC_API_KEY=anthropic-api-key:latest
```

**AWS Secrets Manager:**
```bash
# Store secret
aws secretsmanager create-secret \
  --name anthropic-api-key \
  --secret-string "sk-ant-api03-xxxxx"

# Reference in ECS task definition (see above)
```

**Azure Key Vault:**
```bash
# Create key vault
az keyvault create --name agent-keyvault --resource-group agent-service-rg

# Store secret
az keyvault secret set \
  --vault-name agent-keyvault \
  --name anthropic-api-key \
  --value "sk-ant-api03-xxxxx"
```

---

## Security Considerations

### Container Security

1. **Run as non-root user** ✅ Already configured in Dockerfile
2. **Use minimal base image** ✅ Using `node:20-alpine`
3. **Scan for vulnerabilities:**
   ```bash
   # Trivy scan
   trivy image question-randomizer-agent:latest

   # Snyk scan
   snyk container test question-randomizer-agent:latest
   ```

### Network Security

1. **Use TLS/HTTPS** - Configure ingress with TLS certificates
2. **Firewall rules** - Restrict access to necessary ports only
3. **VPC/Network isolation** - Deploy in private subnets

### Secrets Management

1. **Never commit secrets** - Use `.gitignore` for credential files
2. **Use secret managers** - Cloud provider secret management services
3. **Rotate credentials** - Regular rotation of API keys and passwords
4. **Principle of least privilege** - Minimal permissions for service accounts

---

## Monitoring & Observability

### Health Checks

```bash
# Liveness probe
curl http://your-service/live

# Readiness probe
curl http://your-service/ready

# Full health check
curl http://your-service/health
```

### Logging

**View logs:**
```bash
# Docker
docker logs -f agent-service

# Kubernetes
kubectl logs -f deployment/agent-service -n agent-service

# Cloud Run
gcloud run services logs read agent-service --limit=50

# ECS
aws logs tail /ecs/agent-service --follow
```

### Metrics

**Recommended metrics to monitor:**
- Request rate (requests/second)
- Response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Queue length (BullMQ)
- Active jobs count
- Memory usage
- CPU usage

**Prometheus metrics (add prometheus client):**
```typescript
// TODO: Add prometheus-client for metrics export
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs agent-service

# Common issues:
# 1. Missing environment variables
# 2. Invalid Firebase credentials
# 3. Port already in use
```

### Health Checks Failing

```bash
# Test health endpoint
curl -v http://localhost:3002/health

# Check:
# 1. Service is listening on correct port
# 2. Firestore connection working
# 3. Redis connection working
```

### High Memory Usage

```bash
# Check container stats
docker stats agent-service

# Solutions:
# 1. Increase memory limits
# 2. Reduce QUEUE_CONCURRENCY
# 3. Profile for memory leaks
```

### Slow Performance

```bash
# Check resource limits
kubectl describe pod agent-service-xxx -n agent-service

# Solutions:
# 1. Increase CPU allocation
# 2. Scale horizontally (more replicas)
# 3. Optimize Redis connection
# 4. Enable caching
```

---

## Related Documentation

- **[SETUP.md](./SETUP.md)** - Local development setup
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues
- **[QUEUE.md](./QUEUE.md)** - Queue architecture
- **[STREAMING.md](./STREAMING.md)** - SSE streaming

---

**Your AI Agent Service is ready for production deployment!** 🚀
