#!/bin/bash

# Deployment script for Ryoko AI Trip Planner to Google Cloud Run
# This script reads environment variables from .env file and deploys

set -e

PROJECT_ID="gen-lang-client-0165791662"
SERVICE_NAME="ryoko-ai-trip-planner"
REGION="us-central1"

echo "🚀 Deploying Ryoko AI Trip Planner to Google Cloud Run"
echo "📦 Project: $PROJECT_ID"
echo "🌍 Region: $REGION"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with all required environment variables."
    exit 1
fi

# Source the .env file to get variables
set -a
source .env
set +a

# Check required variables
REQUIRED_VARS=(
    "VITE_FIREBASE_API_KEY"
    "VITE_FIREBASE_AUTH_DOMAIN"
    "VITE_FIREBASE_PROJECT_ID"
    "VITE_FIREBASE_STORAGE_BUCKET"
    "VITE_FIREBASE_MESSAGING_SENDER_ID"
    "VITE_FIREBASE_APP_ID"
    "VITE_GOOGLE_MAPS_API_KEY"
    "GEMINI_API_KEY"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Error: Missing required environment variables:"
    printf '   - %s\n' "${MISSING_VARS[@]}"
    exit 1
fi

echo "✅ All required environment variables found"
echo ""

# Build substitutions string
SUBSTITUTIONS="_VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY},\
_VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN},\
_VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID},\
_VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET},\
_VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID},\
_VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID},\
_VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY},\
_GEMINI_API_KEY=${GEMINI_API_KEY}"

echo "🔨 Starting Cloud Build..."
echo ""

# Submit build
gcloud builds submit \
    --config=cloudbuild.yaml \
    --substitutions="$SUBSTITUTIONS" \
    --project="$PROJECT_ID"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app should be available at:"
echo "   https://${SERVICE_NAME}-${PROJECT_ID//-/}.a.run.app"
echo ""
echo "   Or check with:"
echo "   gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)'"

