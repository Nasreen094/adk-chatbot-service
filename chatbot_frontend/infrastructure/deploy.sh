#!/bin/bash

# Set default values (can be overridden by command-line arguments)
PROJECT_ID=${1:-"prj-udp-dev-qic"}
LOCATION=${2:-"me-central2"}
REPO=${3:-"qaspire-chatbot"}
IMAGE_NAME=${4:-"chatbot-ui"}
TAG=${5:-"latest"}
BACKEND_URL=${6:-"http://10.110.166.13/api/chat/v1"}

# Construct the full image path
IMAGE_URI="$LOCATION-docker.pkg.dev/$PROJECT_ID/$REPO/$IMAGE_NAME:$TAG"

echo "Building Docker image for Frontend..."
docker build -t $IMAGE_URI --build-arg NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL -f infrastructure/Dockerfile .

echo "Authenticating with Google Cloud..."
gcloud auth login
gcloud config set project $PROJECT_ID
gcloud auth configure-docker $LOCATION-docker.pkg.dev

echo "Pushing Docker image to Artifact Registry..."
docker push $IMAGE_URI

echo "Deploying QAspire Chatbot Frontend Job to Cloud Run..."
gcloud run deploy $IMAGE_NAME \
    --image=$IMAGE_URI \
    --region=$LOCATION \
    --project=$PROJECT_ID \
    --platform=managed \
    --ingress=internal \
    --memory=4Gi \
    --cpu=4 \
    --port=3000 \
    --set-env-vars="NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL"
    

echo "Deployment for Q-Aspire Chatbot Frontend Complete."
echo "gcloud run services describe $IMAGE_NAME --region $REGION --project $PROJECT_ID --format='value(status.url)'"
