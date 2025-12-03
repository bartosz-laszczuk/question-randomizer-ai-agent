# Kubernetes Manifests

Kubernetes deployment configuration for the Question Randomizer AI Agent Service.

## Quick Start

```bash
# 1. Create namespace
kubectl create namespace agent-service

# 2. Create secrets (copy secret.yml.example to secret.yml and edit)
kubectl apply -f secret.yml -n agent-service

# 3. Apply ConfigMap
kubectl apply -f configmap.yml -n agent-service

# 4. Deploy Redis (if not using external Redis)
kubectl apply -f redis.yml -n agent-service

# 5. Deploy agent service
kubectl apply -f deployment.yml -n agent-service

# 6. Create service
kubectl apply -f service.yml -n agent-service

# 7. Create ingress (optional)
kubectl apply -f ingress.yml -n agent-service
```

## Files Overview

### deployment.yml
Main application deployment with:
- 3 replicas for high availability
- Resource requests and limits
- Liveness, readiness, and startup probes
- Security context (non-root user)
- Environment variables from ConfigMap and Secrets

### service.yml
Two service definitions:
- `agent-service` - ClusterIP for internal access
- `agent-service-external` - LoadBalancer for external access

### configmap.yml
Non-sensitive configuration:
- Log level
- Firebase project ID
- Redis connection details
- Queue configuration
- Timeout settings

### secret.yml.example
Template for secrets (create secret.yml from this):
- Firebase credentials JSON
- Anthropic API key
- Redis password

**Important:** Never commit `secret.yml` to version control!

### ingress.yml
Ingress configuration for HTTP/HTTPS access:
- NGINX annotations for SSE streaming
- TLS certificate configuration
- Rate limiting
- CORS settings

### redis.yml
Redis deployment (optional):
- Single replica deployment
- Persistent volume for data
- Service for internal access

## Configuration

### Update ConfigMap

Edit `configmap.yml` to change:

```yaml
data:
  log-level: "info"              # Change log level
  firebase-project-id: "your-id" # Your Firebase project
  redis-host: "redis-service"    # Redis hostname
  queue-concurrency: "3"         # Concurrent workers
```

Apply changes:
```bash
kubectl apply -f configmap.yml -n agent-service
kubectl rollout restart deployment/agent-service -n agent-service
```

### Update Secrets

```bash
# Method 1: From files
kubectl create secret generic agent-secrets \
  --from-file=firebase-credentials-json=./firebase-creds.json \
  --from-literal=anthropic-api-key=sk-ant-... \
  -n agent-service \
  --dry-run=client -o yaml | kubectl apply -f -

# Method 2: Edit existing secret
kubectl edit secret agent-secrets -n agent-service
```

## Scaling

### Manual Scaling

```bash
# Scale to 5 replicas
kubectl scale deployment/agent-service --replicas=5 -n agent-service
```

### Auto-Scaling (HPA)

```bash
# Create Horizontal Pod Autoscaler
kubectl autoscale deployment agent-service \
  --min=3 \
  --max=10 \
  --cpu-percent=70 \
  -n agent-service

# Check HPA status
kubectl get hpa -n agent-service
```

### Vertical Scaling

Edit `deployment.yml` to increase resources:

```yaml
resources:
  requests:
    cpu: 1000m      # Increase from 500m
    memory: 1Gi     # Increase from 512Mi
  limits:
    cpu: 4000m      # Increase from 2000m
    memory: 4Gi     # Increase from 2Gi
```

Apply changes:
```bash
kubectl apply -f deployment.yml -n agent-service
```

## Monitoring

### Check Status

```bash
# Pods
kubectl get pods -n agent-service

# Deployments
kubectl get deployments -n agent-service

# Services
kubectl get svc -n agent-service

# Ingress
kubectl get ingress -n agent-service
```

### View Logs

```bash
# All pods
kubectl logs -f deployment/agent-service -n agent-service

# Specific pod
kubectl logs -f agent-service-xxx-yyy -n agent-service

# Previous container (after crash)
kubectl logs agent-service-xxx-yyy -n agent-service --previous
```

### Debug

```bash
# Describe pod (see events)
kubectl describe pod agent-service-xxx-yyy -n agent-service

# Execute shell in pod
kubectl exec -it agent-service-xxx-yyy -n agent-service -- sh

# Port forward for testing
kubectl port-forward svc/agent-service 3002:80 -n agent-service

# Test health endpoint
curl http://localhost:3002/health
```

## Updating

### Rolling Update

```bash
# Update image version
kubectl set image deployment/agent-service \
  agent-service=ghcr.io/your-org/question-randomizer-ai-agent:v1.1.0 \
  -n agent-service

# Watch rollout
kubectl rollout status deployment/agent-service -n agent-service

# Pause rollout (if issues)
kubectl rollout pause deployment/agent-service -n agent-service

# Resume rollout
kubectl rollout resume deployment/agent-service -n agent-service
```

### Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/agent-service -n agent-service

# Rollback to specific revision
kubectl rollout undo deployment/agent-service --to-revision=2 -n agent-service

# View rollout history
kubectl rollout history deployment/agent-service -n agent-service
```

## External Redis

If using an external Redis service (e.g., Cloud Memorystore, ElastiCache):

1. **Update ConfigMap:**
   ```yaml
   data:
     redis-host: "your-external-redis.com"
     redis-port: "6379"
     redis-tls: "true"
   ```

2. **Update Secret (if password required):**
   ```bash
   kubectl create secret generic agent-secrets \
     --from-literal=redis-password=your-password \
     -n agent-service --dry-run=client -o yaml | kubectl apply -f -
   ```

3. **Skip Redis deployment:**
   ```bash
   # Don't apply redis.yml
   ```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n agent-service

# Check events
kubectl describe pod agent-service-xxx -n agent-service

# Common issues:
# - ImagePullBackOff: Check image name and registry access
# - CrashLoopBackOff: Check logs for errors
# - Pending: Check resource availability
```

### Health Checks Failing

```bash
# Check health endpoint from inside pod
kubectl exec -it agent-service-xxx -n agent-service -- wget -O- http://localhost:3002/health

# Common issues:
# - Firestore connection failed: Check Firebase credentials
# - Redis connection failed: Check Redis host and credentials
# - Port not listening: Check if application started correctly
```

### High Memory Usage

```bash
# Check resource usage
kubectl top pods -n agent-service

# Solutions:
# 1. Increase memory limits in deployment.yml
# 2. Reduce QUEUE_CONCURRENCY in configmap.yml
# 3. Check for memory leaks in logs
```

## Production Checklist

- [ ] Secrets created and validated
- [ ] ConfigMap configured for production
- [ ] Resource limits set appropriately
- [ ] Health checks configured
- [ ] Monitoring/alerting set up
- [ ] Auto-scaling configured (HPA)
- [ ] Ingress configured with TLS
- [ ] Network policies applied
- [ ] Backup strategy for Redis data
- [ ] Disaster recovery plan documented

## Related Documentation

- **[DEPLOYMENT.md](../docs/DEPLOYMENT.md)** - Complete deployment guide
- **[SETUP.md](../docs/SETUP.md)** - Local development setup
- **[TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md)** - Common issues

---

**Deploy with confidence!** 🚢
