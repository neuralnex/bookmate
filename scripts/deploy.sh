#!/bin/bash
set -e

echo "Starting deployment process..."

IMAGE_NAME="ghcr.io/${GITHUB_REPOSITORY}:${GITHUB_REF_NAME}"
echo "Image: ${IMAGE_NAME}"

if [ -z "$DEPLOY_METHOD" ]; then
  echo "WARNING: DEPLOY_METHOD not set. Available methods:"
  echo "   - docker-compose: Deploy using docker-compose"
  echo "   - kubernetes: Deploy to Kubernetes"
  echo "   - ssh: Deploy via SSH"
  echo "   - manual: Manual deployment instructions"
  DEPLOY_METHOD="manual"
fi

case "$DEPLOY_METHOD" in
  docker-compose)
    echo "Deploying with Docker Compose..."
    
    if [ -z "$DEPLOY_HOST" ]; then
      echo "ERROR: DEPLOY_HOST not set"
      exit 1
    fi
    
    ssh -o StrictHostKeyChecking=no "$DEPLOY_USER@$DEPLOY_HOST" << EOF
      cd $DEPLOY_PATH || exit 1
      echo "$DOCKER_PASSWORD" | docker login ghcr.io -u "$DOCKER_USERNAME" --password-stdin
      docker pull ${IMAGE_NAME}
      docker-compose down
      docker-compose up -d --no-deps api
      docker-compose ps
      docker system prune -f
EOF
    echo "Deployment completed"
    ;;
    
  kubernetes)
    echo "Deploying to Kubernetes..."
    
    if [ -z "$KUBECONFIG" ]; then
      echo "ERROR: KUBECONFIG not set"
      exit 1
    fi
    
    echo "$KUBECONFIG" | base64 -d > kubeconfig.yaml
    export KUBECONFIG=kubeconfig.yaml
    
    kubectl set image deployment/bookmate-api \
      bookmate-api=${IMAGE_NAME} \
      --namespace=${KUBERNETES_NAMESPACE:-default}
    
    kubectl rollout status deployment/bookmate-api \
      --namespace=${KUBERNETES_NAMESPACE:-default}
    
    echo "Kubernetes deployment completed"
    ;;
    
  ssh)
    echo "Deploying via SSH..."
    
    if [ -z "$DEPLOY_HOST" ] || [ -z "$DEPLOY_USER" ] || [ -z "$DEPLOY_PATH" ]; then
      echo "ERROR: Required SSH deployment variables not set"
      exit 1
    fi
    
    ssh -o StrictHostKeyChecking=no "$DEPLOY_USER@$DEPLOY_HOST" << EOF
      cd $DEPLOY_PATH || exit 1
      echo "$DOCKER_PASSWORD" | docker login ghcr.io -u "$DOCKER_USERNAME" --password-stdin
      docker pull ${IMAGE_NAME}
      docker stop bookmate-api || true
      docker rm bookmate-api || true
      docker run -d \\
        --name bookmate-api \\
        --network bookmate-network \\
        --restart unless-stopped \\
        -p 3000:3000 \\
        --env-file .env \\
        ${IMAGE_NAME}
      docker ps | grep bookmate-api
EOF
    echo "SSH deployment completed"
    ;;
    
  manual)
    echo "Manual Deployment Instructions:"
    echo ""
    echo "1. Pull the latest image:"
    echo "   docker pull ${IMAGE_NAME}"
    echo ""
    echo "2. Update your docker-compose.yml to use:"
    echo "   image: ${IMAGE_NAME}"
    echo ""
    echo "3. Deploy with docker-compose:"
    echo "   docker-compose pull"
    echo "   docker-compose up -d"
    echo ""
    echo "4. Or run directly:"
    echo "   docker run -d \\"
    echo "     --name bookmate-api \\"
    echo "     -p 3000:3000 \\"
    echo "     --env-file .env \\"
     echo "     ${IMAGE_NAME}"
    echo ""
    echo "Deployment instructions provided"
    ;;
    
  *)
    echo "ERROR: Unknown deployment method: $DEPLOY_METHOD"
    exit 1
    ;;
esac

echo "Deployment process completed!"

