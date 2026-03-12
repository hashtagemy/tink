#!/bin/bash
# Tink Backend - Google Cloud Run Deployment Script
# Usage: ./deploy.sh

set -e

PROJECT_ID="tink-tudor"
SERVICE_NAME="tink-backend"
REGION="us-central1"
SOURCE_DIR="./tink/backend"

echo "Deploying Tink backend to Google Cloud Run..."
echo "  Project:  $PROJECT_ID"
echo "  Service:  $SERVICE_NAME"
echo "  Region:   $REGION"
echo ""

gcloud run deploy "$SERVICE_NAME" \
  --source "$SOURCE_DIR" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --allow-unauthenticated

echo ""
echo "Deployment complete!"
echo "Service URL: https://$SERVICE_NAME-311491562311.$REGION.run.app"
