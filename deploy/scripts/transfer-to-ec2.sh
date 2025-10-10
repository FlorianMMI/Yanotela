#!/bin/bash
# Quick transfer script for EC2 deployment

# CONFIGURATION - Update these with your EC2 details
EC2_IP="13.36.209.205"           # e.g., "54.123.45.67"
SSH_KEY="cles_yanotela_1.pem"        # e.g., "~/.ssh/my-ec2-key.pem"
EC2_USER="ubuntu"                     # Usually "ubuntu", "ec2-user", or "admin"

echo "🚀 Transferring files to EC2 instance..."

# Transfer deployment script
echo "📁 Transferring deploy-ec2.sh..."
scp -i "$SSH_KEY" deploy/scripts/deploy-ec2.sh $EC2_USER@$EC2_IP:~/

# Transfer docker-compose production file
echo "📁 Transferring docker-compose.prod.yml..."
scp -i "$SSH_KEY" docker-compose.prod.yml $EC2_USER@$EC2_IP:~/

echo "✅ Files transferred successfully!"
echo ""
echo "🔑 To connect to your EC2 instance:"
echo "ssh -i $SSH_KEY $EC2_USER@$EC2_IP"
echo ""
echo "📋 Next steps on EC2:"
echo "1. chmod +x deploy-ec2.sh"
echo "2. Set environment variables"
echo "3. Run: ./deploy-ec2.sh"
