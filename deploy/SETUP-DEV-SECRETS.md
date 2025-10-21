# Development GitHub Secrets Setup

This guide explains how to set up GitHub Secrets for the **development deployment workflow**.

## Required Secrets

### `DOCKER_PASSWORD`
Your Docker Hub personal access token for pushing development images.

**How to get it:**
1. Go to [Docker Hub](https://hub.docker.com/)
2. Login and go to Account Settings > Security
3. Create a new Access Token with **Read & Write** permissions
4. Copy the token (you won't see it again!)

**In GitHub:**
- Go to Settings > Secrets and variables > Actions
- Click "New repository secret"
- Name: `DOCKER_PASSWORD`
- Value: `your-docker-hub-token`

### `EC2_SSH_PRIVATE_KEY`
The private SSH key for accessing your **development EC2 instance** (yanotela.fr).

**Format:** Complete private key including headers:
```
-----BEGIN OPENSSH PRIVATE KEY-----
your-private-key-content-here
-----END OPENSSH PRIVATE KEY-----
```

**Important:** Make sure this key has access to your development EC2 instance.

## Development Workflow

The `develop-ec2.yml` workflow will automatically:

1. **Build & Push**: Build development images and push to:
   - `jefee/yanotela-frontend-dev:develop`
   - `jefee/yanotela-backend-dev:develop`

2. **Deploy**: SSH into development EC2 (yanotela.fr) and:
   - Pull latest development images
   - Update containers using `docker-compose.dev.yml`
   - Start services on ports 3000 (frontend) and 3001 (backend)

## Verification

After setting up the secrets:

1. Push changes to the `Develop` branch
2. Check the Actions tab for the "Development EC2 Deployment" workflow
3. Verify deployment success by accessing:
   - Frontend: https://yanotela.fr:3000
   - Backend: https://yanotela.fr:3001

## Security Notes

- Development secrets should be different from production
- Use strong passwords even for development
- Development EC2 should be isolated from production infrastructure
- Regularly rotate access tokens and SSH keys
