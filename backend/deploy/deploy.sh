#!/usr/bin/env bash
# PathGlot — Cloud Run deploy script
# Usage: ./deploy.sh
# Requires: gcloud CLI authenticated, env vars set in .env or shell

set -euo pipefail

source "$(dirname "$0")/../../.env" 2>/dev/null || true

PROJECT="${GOOGLE_CLOUD_PROJECT:?Set GOOGLE_CLOUD_PROJECT}"
REGION="${CLOUD_RUN_REGION:-us-central1}"
REPO="pathglot"
BACKEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT/$REPO/backend"
FRONTEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT/$REPO/frontend"

echo "==> Ensuring Artifact Registry repo exists"
gcloud artifacts repositories describe "$REPO" \
  --project="$PROJECT" \
  --location="$REGION" 2>/dev/null || \
gcloud artifacts repositories create "$REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --project="$PROJECT"

echo "==> Authenticating Docker"
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet

ROOT="$(dirname "$0")/../.."

echo "==> Building and pushing backend image"
docker build -t "$BACKEND_IMAGE:latest" "$ROOT/backend"
docker push "$BACKEND_IMAGE:latest"

echo "==> Deploying backend to Cloud Run"
gcloud run deploy pathglot-backend \
  --image="$BACKEND_IMAGE:latest" \
  --platform=managed \
  --region="$REGION" \
  --project="$PROJECT" \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_API_KEY=$GEMINI_API_KEY,GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY,GOOGLE_CLOUD_PROJECT=$PROJECT" \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi \
  --timeout=3600

BACKEND_URL=$(gcloud run services describe pathglot-backend \
  --platform=managed \
  --region="$REGION" \
  --project="$PROJECT" \
  --format="value(status.url)")

# Convert https:// to wss:// for WebSocket
BACKEND_WS_URL="${BACKEND_URL/https:\/\//wss://}"

echo "==> Backend deployed at: $BACKEND_URL"
echo "==> WebSocket URL: $BACKEND_WS_URL"

echo "==> Building and pushing frontend image"
docker build \
  --build-arg "VITE_GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY" \
  --build-arg "VITE_BACKEND_WS_URL=$BACKEND_WS_URL" \
  --target prod \
  -t "$FRONTEND_IMAGE:latest" \
  "$ROOT/frontend"
docker push "$FRONTEND_IMAGE:latest"

echo "==> Deploying frontend to Cloud Run"
gcloud run deploy pathglot-frontend \
  --image="$FRONTEND_IMAGE:latest" \
  --platform=managed \
  --region="$REGION" \
  --project="$PROJECT" \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=5 \
  --memory=256Mi

FRONTEND_URL=$(gcloud run services describe pathglot-frontend \
  --platform=managed \
  --region="$REGION" \
  --project="$PROJECT" \
  --format="value(status.url)")

echo ""
echo "======================================"
echo "  PathGlot deployed successfully!"
echo "======================================"
echo "  Frontend: $FRONTEND_URL"
echo "  Backend:  $BACKEND_URL"
echo "======================================"
