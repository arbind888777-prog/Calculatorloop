# Google Cloud Build Fix Guide

## समस्या (Problem)
आपका Google Cloud Build fail हो रहा था क्योंकि:
1. **`cloudbuild.yaml` नहीं था** - Cloud Build को configuration नहीं पता था
2. **Dockerfile में कुछ issues** थे
3. **Service Account permissions** सही नहीं से configure थे

## समाधान (Solution)

### 1. ✅ Files बनाए गए / Updated किए गए:
- ✅ **`cloudbuild.yaml`** - बनाया गया (नया)
- ✅ **`Dockerfile`** - बेहतर बनाया गया

### 2. Google Cloud में करने वाले काम:

#### Step 1: Cloud Build Service Account को Permissions दें
```bash
gcloud projects get-iam-policy YOUR_PROJECT_ID

# Cloud Build Service Account को यह permissions देने हैं:
# - Cloud Run Service Agent
# - Cloud Build Service Account
# - Storage Object Admin (for GCR)
# - Artifact Registry Service Agent (if using Artifact Registry)
```

#### Step 2: GitHub से Cloud Build Connect करें
1. Google Cloud Console खोलें
2. **Cloud Build** → **Triggers** खोलें
3. **Create Trigger** दबाएं
4. **Source** में GitHub को select करें
5. अपने repository को connect करें:
   - Repository: `arbind888777-prog/Calculatorloop`
   - Branch: `main`
6. **Cloud Build configuration file (yaml or json)** select करें
7. **cloudbuild.yaml** path दें
8. **Create** दबाएं

#### Step 3: पहली बार Build करने के लिए
```bash
gcloud builds submit --config=cloudbuild.yaml --region=asia-south1
```

### 3. Dockerfile में किए गए सुधार:
✅ **Fixed Issues:**
- Python और build tools को install किया (npm modules के लिए)
- Non-root user (nextjs) बनाए (security के लिए)
- **dumb-init** add किया (signal handling के लिए)
- Health check लगाया (Cloud Run के लिए)
- ENTRYPOINT properly set किया
- File copying को बेहतर बनाया

### 4. cloudbuild.yaml Configuration
```yaml
# 2 steps में काम करता है:
1. Docker image को build करता है
2. Google Container Registry (GCR) में push करता है

Available variables:
- $PROJECT_ID = आपका Google Cloud Project ID
- $SHORT_SHA = Git commit का short hash
```

### 5. अगर फिर भी Error आए:
#### Error: "failed to fetch base layers"
```bash
# Cloud Build में image pull permissions दें
gcloud auth configure-docker gcr.io
```

#### Error: "untrusted builder"
```bash
# Cloud Build API को enable करें
gcloud services enable cloudbuild.googleapis.com
```

#### Error: "permission denied"
```bash
# Service Account को Editor role दें (temporary)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member=serviceAccount:YOUR_CLOUDBUILD_SA@cloudbuild.gserviceaccount.com \
  --role=roles/editor
```

### 6. Cloud Run में Deploy करने के लिए (Optional)
अगर Cloud Run में deploy करना है, तो cloudbuild.yaml में यह जोड़ें:
```yaml
- name: 'gcr.io/cloud-builders/gke-deploy'
  args:
    - 'run'
    - '-f=k8s/'
    - '-i=gcr.io/$PROJECT_ID/calculatorloop:$SHORT_SHA'
    - '-l=gcr.io/$PROJECT_ID/calculatorloop:latest'
```

## Commands:

```bash
# Local में build करके test करें
docker build -t calculatorloop:latest .
docker run -p 8080:8080 calculatorloop:latest

# Google Cloud आपके लिए automation handle करेगा
```

## Status
✅ **Files Updated Successfully**
- cloudbuild.yaml ........... Created
- Dockerfile ................. Fixed
- Ready for Google Cloud Build deployment
