# Deploying Ryoko AI Trip Planner to Google Cloud Run

This guide will help you deploy the Ryoko AI Trip Planner application to Google Cloud Run.

## Prerequisites

1. **Google Cloud Account**: You need a Google Cloud account with billing enabled
2. **Google Cloud SDK (gcloud)**: Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
3. **Docker**: Install [Docker](https://www.docker.com/get-started) (for local testing)
4. **Environment Variables**: All required environment variables (see below)

## Required Environment Variables

The following environment variables are needed for the build:

- `VITE_FIREBASE_API_KEY` - Firebase API Key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase Auth Domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase Project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase Storage Bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase Messaging Sender ID
- `VITE_FIREBASE_APP_ID` - Firebase App ID
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API Key
- `GEMINI_API_KEY` - Google Gemini API Key

## Deployment Methods

### Method 1: Using Google Cloud Build (Recommended)

This method uses Cloud Build to automatically build and deploy your application.

#### Step 1: Set up Google Cloud Project

```bash
# Login to Google Cloud
gcloud auth login

# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

#### Step 2: Set Build Substitutions (Environment Variables)

Set the environment variables as Cloud Build substitutions:

```bash
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_VITE_FIREBASE_API_KEY="your-firebase-api-key",\
_VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com",\
_VITE_FIREBASE_PROJECT_ID="your-project-id",\
_VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com",\
_VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id",\
_VITE_FIREBASE_APP_ID="your-app-id",\
_VITE_GOOGLE_MAPS_API_KEY="your-maps-api-key",\
_GEMINI_API_KEY="your-gemini-api-key"
```

**Note**: For security, consider using Secret Manager instead (see Method 3).

#### Step 3: Deploy

```bash
gcloud builds submit --config=cloudbuild.yaml
```

### Method 2: Manual Deployment with Docker

#### Step 1: Build Docker Image Locally

```bash
docker build \
  --build-arg VITE_FIREBASE_API_KEY="your-firebase-api-key" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com" \
  --build-arg VITE_FIREBASE_PROJECT_ID="your-project-id" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id" \
  --build-arg VITE_FIREBASE_APP_ID="your-app-id" \
  --build-arg VITE_GOOGLE_MAPS_API_KEY="your-maps-api-key" \
  --build-arg GEMINI_API_KEY="your-gemini-api-key" \
  -t gcr.io/YOUR_PROJECT_ID/ryoko-ai-trip-planner:latest .
```

#### Step 2: Push to Container Registry

```bash
# Configure Docker to use gcloud as a credential helper
gcloud auth configure-docker

# Push the image
docker push gcr.io/YOUR_PROJECT_ID/ryoko-ai-trip-planner:latest
```

#### Step 3: Deploy to Cloud Run

```bash
gcloud run deploy ryoko-ai-trip-planner \
  --image gcr.io/YOUR_PROJECT_ID/ryoko-ai-trip-planner:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

### Method 3: Using Secret Manager (Most Secure)

For production, store sensitive values in Secret Manager:

#### Step 1: Create Secrets

```bash
# Create secrets
echo -n "your-firebase-api-key" | gcloud secrets create vite-firebase-api-key --data-file=-
echo -n "your-gemini-api-key" | gcloud secrets create gemini-api-key --data-file=-
# ... repeat for other secrets
```

#### Step 2: Update cloudbuild.yaml

Modify `cloudbuild.yaml` to use secrets:

```yaml
availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/vite-firebase-api-key/versions/latest
      env: 'VITE_FIREBASE_API_KEY'
    - versionName: projects/$PROJECT_ID/secrets/gemini-api-key/versions/latest
      env: 'GEMINI_API_KEY'
    # ... add other secrets
```

#### Step 3: Grant Secret Access

```bash
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding vite-firebase-api-key \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Post-Deployment

### 1. Update Firebase Authorized Domains

Add your Cloud Run URL to Firebase authorized domains:

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your Cloud Run URL (e.g., `ryoko-ai-trip-planner-xxxxx-uc.a.run.app`)

### 2. Update CORS Settings

If you have any CORS issues, ensure your Firebase and Google Maps APIs allow your Cloud Run domain.

### 3. Set Up Custom Domain (Optional)

```bash
gcloud run domain-mappings create \
  --service ryoko-ai-trip-planner \
  --domain yourdomain.com \
  --region us-central1
```

## Updating the Deployment

To update your deployment:

```bash
# Rebuild and redeploy
gcloud builds submit --config=cloudbuild.yaml
```

Or if using manual method:

```bash
docker build -t gcr.io/YOUR_PROJECT_ID/ryoko-ai-trip-planner:latest .
docker push gcr.io/YOUR_PROJECT_ID/ryoko-ai-trip-planner:latest
gcloud run deploy ryoko-ai-trip-planner \
  --image gcr.io/YOUR_PROJECT_ID/ryoko-ai-trip-planner:latest \
  --region us-central1
```

## Monitoring

View logs:

```bash
gcloud run services logs read ryoko-ai-trip-planner --region us-central1
```

View service details:

```bash
gcloud run services describe ryoko-ai-trip-planner --region us-central1
```

## Troubleshooting

### Build Fails

- Check that all environment variables are set correctly
- Verify Docker is running
- Check Cloud Build logs: `gcloud builds list`

### App Doesn't Load

- Check Cloud Run logs for errors
- Verify Firebase configuration is correct
- Check browser console for errors
- Ensure Firebase authorized domains include your Cloud Run URL

### Environment Variables Not Working

- Remember: Vite environment variables must start with `VITE_`
- Variables are embedded at build time, not runtime
- Rebuild the Docker image after changing environment variables

## Cost Considerations

Cloud Run pricing:
- **Free Tier**: 2 million requests/month, 400,000 GB-seconds, 200,000 vCPU-seconds
- **After Free Tier**: Pay per use (requests, CPU, memory)

## Security Notes

⚠️ **Important**: The `GEMINI_API_KEY` is currently embedded in the client-side code. For production, consider:
1. Moving the Gemini API calls to a backend service
2. Using Cloud Functions or Cloud Run for the backend API
3. Implementing API key protection on the backend

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

