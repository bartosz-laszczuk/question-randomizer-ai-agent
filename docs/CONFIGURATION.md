# Configuration Guide

Complete configuration reference for the Question Randomizer AI Agent Service.

---

## Environment Variables

### Server Configuration

```bash
# Server
NODE_ENV=development|test|production
PORT=3002
LOG_LEVEL=debug|info|warn|error
```

**Details:**
- **NODE_ENV**: Controls environment-specific behavior (logging, error handling)
- **PORT**: HTTP server port (default: 3002)
- **LOG_LEVEL**: Pino logging level
  - `debug`: Development (verbose logging)
  - `info`: Production (standard logging)
  - `warn`: Production (warnings only)
  - `error`: Production (errors only)

---

### Firebase Configuration

```bash
# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS_PATH=./firebase-dev-credentials.json
# OR (for production)
FIREBASE_CREDENTIALS_JSON={"type":"service_account",...}
```

**Two Configuration Methods:**

#### 1. File-based (Development)
Use `FIREBASE_CREDENTIALS_PATH` to point to a JSON file:
```bash
FIREBASE_CREDENTIALS_PATH=./firebase-dev-credentials.json
```

**Service Account JSON Structure:**
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

#### 2. Inline JSON (Production)
Use `FIREBASE_CREDENTIALS_JSON` for inline credentials:
```bash
FIREBASE_CREDENTIALS_JSON='{"type":"service_account","project_id":"your-project-id",...}'
```

**Best Practices:**
- Never commit credentials to Git
- Use Secret Manager in production (Google Cloud Secret Manager, AWS Secrets Manager, Azure Key Vault)
- Or use Workload Identity (GCP) / IAM roles (AWS) for automatic credentials

---

### Anthropic Configuration

```bash
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

**Details:**
- Get API key from [console.anthropic.com](https://console.anthropic.com)
- API key starts with `sk-ant-`
- Used to authenticate with Claude API
- Required for all agent operations

**Production Best Practices:**
- Store in Secret Manager (never in environment files)
- Rotate keys regularly
- Monitor usage in Anthropic console

---

### Redis Configuration

```bash
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false|true
```

**Details:**
- **REDIS_HOST**: Redis server hostname/IP
- **REDIS_PORT**: Redis port (default: 6379)
- **REDIS_PASSWORD**: Redis password (optional for local dev, required for production)
- **REDIS_TLS**: Enable TLS for secure connections (required for most cloud Redis services)

**Redis Configuration Examples:**

#### Local Development
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false
```

#### Production (Google Cloud Memorystore)
```bash
REDIS_HOST=10.0.0.3
REDIS_PORT=6379
REDIS_PASSWORD=${SECRET:REDIS_PASSWORD}
REDIS_TLS=true
```

#### Production (AWS ElastiCache)
```bash
REDIS_HOST=my-cluster.abc123.0001.use1.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=${SECRET:REDIS_PASSWORD}
REDIS_TLS=true
```

#### Production (Azure Cache for Redis)
```bash
REDIS_HOST=my-cache.redis.cache.windows.net
REDIS_PORT=6380
REDIS_PASSWORD=${SECRET:REDIS_PASSWORD}
REDIS_TLS=true
```

---

### Queue Configuration

```bash
# Queue
QUEUE_CONCURRENCY=3
```

**Details:**
- **QUEUE_CONCURRENCY**: Number of concurrent BullMQ workers
- Default: 3 (good for most use cases)
- Increase for higher throughput (requires more CPU/memory)
- Decrease if tasks are resource-intensive

**Recommendations:**
- Small instances (1-2 CPU): `QUEUE_CONCURRENCY=1`
- Medium instances (2-4 CPU): `QUEUE_CONCURRENCY=3`
- Large instances (4+ CPU): `QUEUE_CONCURRENCY=5-10`

---

### Timeout Configuration

```bash
# Timeouts
AGENT_TIMEOUT_MS=120000
REQUEST_TIMEOUT_MS=150000
```

**Details:**
- **AGENT_TIMEOUT_MS**: Maximum agent task execution time (default: 120000ms = 2 minutes)
- **REQUEST_TIMEOUT_MS**: Maximum HTTP request timeout (default: 150000ms = 2.5 minutes)

**Guidelines:**
- `REQUEST_TIMEOUT_MS` should always be > `AGENT_TIMEOUT_MS`
- Increase for complex tasks (e.g., analyzing 500+ questions)
- Decrease for faster failure detection

---

## Environment Examples

### Development (.env)

```env
# Server
NODE_ENV=development
PORT=3002
LOG_LEVEL=debug

# Firebase
FIREBASE_PROJECT_ID=dev-project
FIREBASE_CREDENTIALS_PATH=./firebase-dev-credentials.json

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api03-...

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

# Queue
QUEUE_CONCURRENCY=3

# Timeouts
AGENT_TIMEOUT_MS=120000
REQUEST_TIMEOUT_MS=150000
```

---

### Testing (.env.test)

```env
# Server
NODE_ENV=test
PORT=3003
LOG_LEVEL=error

# Firebase (uses emulator)
FIREBASE_PROJECT_ID=test-project
FIREBASE_CREDENTIALS_PATH=./firebase-test-credentials.json
FIRESTORE_EMULATOR_HOST=localhost:8080

# Anthropic (mock)
ANTHROPIC_API_KEY=sk-ant-test-key

# Redis (testcontainers)
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=
REDIS_TLS=false

# Queue
QUEUE_CONCURRENCY=1

# Timeouts (shorter for tests)
AGENT_TIMEOUT_MS=30000
REQUEST_TIMEOUT_MS=60000
```

---

### Production (Google Cloud Run)

```env
# Server
NODE_ENV=production
PORT=3002
LOG_LEVEL=info

# Firebase
FIREBASE_PROJECT_ID=prod-project
FIREBASE_CREDENTIALS_JSON=${SECRET:FIREBASE_CREDENTIALS}

# Anthropic
ANTHROPIC_API_KEY=${SECRET:ANTHROPIC_API_KEY}

# Redis (Memorystore)
REDIS_HOST=${SECRET:REDIS_HOST}
REDIS_PORT=6379
REDIS_PASSWORD=${SECRET:REDIS_PASSWORD}
REDIS_TLS=true

# Queue
QUEUE_CONCURRENCY=5

# Timeouts
AGENT_TIMEOUT_MS=120000
REQUEST_TIMEOUT_MS=150000
```

**Cloud Run Deployment:**
```bash
# Set secrets in Google Cloud Secret Manager
gcloud secrets create FIREBASE_CREDENTIALS --data-file=./firebase-prod-credentials.json
gcloud secrets create ANTHROPIC_API_KEY --data-file=./anthropic-api-key.txt
gcloud secrets create REDIS_PASSWORD --data-file=./redis-password.txt

# Deploy with secrets
gcloud run deploy agent-service \
  --image gcr.io/PROJECT/agent-service \
  --set-env-vars NODE_ENV=production,PORT=3002,LOG_LEVEL=info \
  --set-secrets FIREBASE_CREDENTIALS_JSON=FIREBASE_CREDENTIALS:latest \
  --set-secrets ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest \
  --set-secrets REDIS_PASSWORD=REDIS_PASSWORD:latest
```

---

### Production (Kubernetes)

**ConfigMap (`k8s/configmap.yaml`):**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: agent-service-config
data:
  NODE_ENV: "production"
  PORT: "3002"
  LOG_LEVEL: "info"
  FIREBASE_PROJECT_ID: "prod-project"
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"
  REDIS_TLS: "false"
  QUEUE_CONCURRENCY: "5"
  AGENT_TIMEOUT_MS: "120000"
  REQUEST_TIMEOUT_MS: "150000"
```

**Secret (`k8s/secret.yaml`):**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: agent-service-secrets
type: Opaque
stringData:
  FIREBASE_CREDENTIALS_JSON: |
    {"type":"service_account","project_id":"prod-project",...}
  ANTHROPIC_API_KEY: "sk-ant-..."
  REDIS_PASSWORD: "your-redis-password"
```

**Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agent-service
spec:
  template:
    spec:
      containers:
      - name: agent-service
        image: gcr.io/PROJECT/agent-service:latest
        envFrom:
        - configMapRef:
            name: agent-service-config
        - secretRef:
            name: agent-service-secrets
```

---

### Production (AWS ECS/Fargate)

**Task Definition (JSON):**
```json
{
  "family": "agent-service",
  "containerDefinitions": [
    {
      "name": "agent-service",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/agent-service:latest",
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3002"},
        {"name": "LOG_LEVEL", "value": "info"},
        {"name": "FIREBASE_PROJECT_ID", "value": "prod-project"},
        {"name": "REDIS_HOST", "value": "redis.abc123.0001.use1.cache.amazonaws.com"},
        {"name": "REDIS_PORT", "value": "6379"},
        {"name": "REDIS_TLS", "value": "true"},
        {"name": "QUEUE_CONCURRENCY", "value": "5"}
      ],
      "secrets": [
        {
          "name": "FIREBASE_CREDENTIALS_JSON",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:firebase-credentials-ABC123"
        },
        {
          "name": "ANTHROPIC_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:anthropic-api-key-XYZ789"
        },
        {
          "name": "REDIS_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:redis-password-DEF456"
        }
      ]
    }
  ]
}
```

---

### Production (Azure Container Instances)

**ARM Template:**
```json
{
  "type": "Microsoft.ContainerInstance/containerGroups",
  "properties": {
    "containers": [
      {
        "name": "agent-service",
        "properties": {
          "image": "myregistry.azurecr.io/agent-service:latest",
          "environmentVariables": [
            {"name": "NODE_ENV", "value": "production"},
            {"name": "PORT", "value": "3002"},
            {"name": "LOG_LEVEL", "value": "info"},
            {"name": "FIREBASE_PROJECT_ID", "value": "prod-project"},
            {"name": "REDIS_HOST", "value": "my-cache.redis.cache.windows.net"},
            {"name": "REDIS_PORT", "value": "6380"},
            {"name": "REDIS_TLS", "value": "true"},
            {"name": "QUEUE_CONCURRENCY", "value": "5"},
            {"name": "FIREBASE_CREDENTIALS_JSON", "secureValue": "..."},
            {"name": "ANTHROPIC_API_KEY", "secureValue": "..."},
            {"name": "REDIS_PASSWORD", "secureValue": "..."}
          ]
        }
      }
    ]
  }
}
```

---

## Configuration Validation

The service validates all environment variables at startup using Zod schemas (see `src/config/environment.ts`).

**Validation Rules:**
- All required variables must be present
- PORT must be a number between 1-65535
- LOG_LEVEL must be one of: debug, info, warn, error
- REDIS_PORT must be a number
- QUEUE_CONCURRENCY must be a positive integer
- Timeout values must be positive numbers

**Startup Behavior:**
- If validation fails, service logs error and exits with code 1
- In production, missing secrets cause immediate failure (fail-fast)
- In development, some variables have defaults

---

## Security Best Practices

### 1. Never Commit Credentials
**Add to .gitignore:**
```
.env
.env.local
.env.production
firebase-*-credentials.json
*.pem
*.key
```

### 2. Use Secret Managers
**Recommended:**
- **Google Cloud**: Secret Manager
- **AWS**: Secrets Manager or Parameter Store
- **Azure**: Key Vault
- **Kubernetes**: Sealed Secrets or External Secrets Operator

### 3. Rotate Secrets Regularly
- Anthropic API key: Every 90 days
- Firebase service account: Every 180 days
- Redis password: Every 90 days

### 4. Principle of Least Privilege
- Firebase service account: Only grant Firestore read/write (not admin)
- Redis: Use ACLs to restrict commands if possible
- Anthropic API key: Monitor usage limits

### 5. Enable TLS
- Always use `REDIS_TLS=true` in production
- Anthropic API uses HTTPS by default
- Firebase uses HTTPS by default

---

## Troubleshooting

### Issue: "Environment validation failed"
**Solution:**
1. Check all required variables are set in `.env`
2. Run `npm run type-check` to verify
3. Check logs for specific validation error

### Issue: "Firebase initialization failed"
**Solution:**
1. Verify `FIREBASE_PROJECT_ID` matches your Firebase project
2. Check credentials file exists at `FIREBASE_CREDENTIALS_PATH`
3. Verify JSON is valid: `node -e "require('./firebase-dev-credentials.json')"`

### Issue: "Redis connection failed"
**Solution:**
1. Verify Redis is running: `redis-cli ping`
2. Check `REDIS_HOST` and `REDIS_PORT` are correct
3. Test connection: `redis-cli -h HOST -p PORT -a PASSWORD ping`

### Issue: "Anthropic API authentication failed"
**Solution:**
1. Verify API key starts with `sk-ant-`
2. Check key is active in Anthropic console
3. Ensure no whitespace in `ANTHROPIC_API_KEY`

---

## Configuration Checklist

### Development Setup
- [ ] Copy `.env.example` to `.env`
- [ ] Set `FIREBASE_PROJECT_ID`
- [ ] Download and set `FIREBASE_CREDENTIALS_PATH`
- [ ] Get and set `ANTHROPIC_API_KEY`
- [ ] Start Redis: `docker-compose up redis`
- [ ] Verify: `npm run dev` starts successfully

### Production Setup
- [ ] Set all environment variables in deployment platform
- [ ] Store secrets in Secret Manager
- [ ] Enable `REDIS_TLS=true`
- [ ] Set appropriate `QUEUE_CONCURRENCY` for instance size
- [ ] Set `LOG_LEVEL=info` or `LOG_LEVEL=warn`
- [ ] Configure health check endpoints
- [ ] Test deployment with smoke test

---

**See Also:**
- [SETUP.md](./SETUP.md) - Complete setup guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues
