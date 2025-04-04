# Sunmax AI Talent Quest - Competition Submission Platform

[![Cloud Run Deployment Status](https://img.shields.io/badge/Cloud_Run-Deployed-4285F4?logo=googlecloud)](https://competition.sunmax.live)

## Overview

Welcome to the Sunmax AI Talent Quest! This web application provides a platform for participants to submit their entries across various creative and technical categories. It features user registration, categorized submissions, secure file uploads, online payment processing via Razorpay, and an administrator dashboard for managing submissions.

This project utilizes a modern stack including Node.js, Express, MongoDB Atlas for the database, Google Cloud Storage (GCS) for persistent file storage, and is deployed as a containerized application on Google Cloud Run for scalability and ease of management.

This README provides a comprehensive guide covering the entire setup, deployment, and configuration process.

![image](https://github.com/user-attachments/assets/c8f14692-6f0d-43ef-bfaf-8d2e7634afe4)

## Features

* **User-Friendly Submission Form:** Simple interface for participants to enter details.
* **Categorized Entries:** Supports multiple competition categories (Essay, Drawing, Photography, Singing).
* **Secure File Uploads:** Handles file uploads directly to Google Cloud Storage for persistence and security.
* **Payment Integration:** Uses Razorpay for processing the ₹100 INR entry fee.
* **Admin Panel:** Secure login for administrators.
* **Admin Dashboard:** View all submissions, participant details, payment status, and download submitted files directly from GCS.
* **Cloud Native Deployment:** Hosted on Google Cloud Run, ensuring scalability and reliability.
* **Custom Domain:** Accessible via a custom subdomain (`https://competition.sunmax.live`).
* **Responsive Design:** Adapts to various screen sizes (desktops, tablets, mobiles).

## Technology Stack

* **Backend:** Node.js, Express.js
* **Frontend:** HTML5, CSS3, Vanilla JavaScript
* **Database:** MongoDB Atlas (Cloud-hosted)
* **File Storage:** Google Cloud Storage (GCS)
* **Payment Gateway:** Razorpay
* **Deployment:** Docker, Google Cloud Run, Google Cloud Build, Google Artifact Registry
* **DNS Management:** Netlify (for the custom domain)

## Prerequisites

Before you begin, ensure you have the following accounts, tools, and information ready:

1.  **Node.js and npm:** Installed on your local machine. ([Download Node.js](https://nodejs.org/)) Verify with `node -v` and `npm -v`.
2.  **Google Cloud Platform (GCP) Account:**
    * An active GCP account ([https://cloud.google.com/](https://cloud.google.com/)).
    * **Billing Enabled:** Even if using the free tier, billing must be enabled on your project for many services (like Cloud Build, Artifact Registry) to function.
    * **Project ID:** Know your unique GCP Project ID (e.g., `triple-reef-453214-e6`).
3.  **`gcloud` CLI:** Google Cloud Command Line Interface installed and authenticated. ([Install gcloud CLI](https://cloud.google.com/sdk/docs/install)). Verify by running `gcloud auth login` and `gcloud config list`.
4.  **MongoDB Atlas Account:**
    * A free (M0 tier) or paid MongoDB Atlas account ([https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)).
    * Database username and password.
    * Cluster connection string.
5.  **Razorpay Account:**
    * A Razorpay account ([https://razorpay.com/](https://razorpay.com/)).
    * Test API Key ID and Key Secret.
    * Live API Key ID and Key Secret (obtained after website verification).
6.  **Domain Name:** A registered domain name (e.g., `sunmax.live` purchased from Name.com).
7.  **DNS Provider Access:** Access to manage DNS records where your domain's nameservers are pointed (in this case, Netlify).
8.  **Code Editor:** A text editor like VS Code ([https://code.visualstudio.com/](https://code.visualstudio.com/)).
9.  **(Optional) Git & GitHub/GitLab:** Recommended for version control, but not strictly required for the deployment steps followed here.

## Project Structure

```
competition-app/
├── public/                     # Static files (HTML, CSS, Frontend JS)
│   ├── css/
│   │   └── style.css           # Main stylesheet
│   ├── js/
│   │   ├── main.js             # Logic for index page
│   │   ├── form.js             # Logic for submission form & Razorpay
│   │   └── admin.js            # Logic for admin login & dashboard
│   ├── images/                 # Site images (ensure no dummies!)
│   ├── index.html              # Category selection page
│   ├── form.html               # Submission form page
│   ├── admin_login.html        # Admin login page
│   ├── admin_dashboard.html    # Admin dashboard page
│   └── thank_you.html          # Post-submission thank you page
├── routes/                     # Backend API routes
│   ├── admin.js                # Admin routes
│   └── submissions.js          # Submission & payment routes (using GCS)
├── models/                     # Mongoose schemas
│   └── Submission.js           # Submission data model
├── .env                        # Environment variables (!!! DO NOT COMMIT !!!)
├── .gitignore                  # Files/folders ignored by Git
├── .dockerignore               # Files/folders ignored by Docker build
├── Dockerfile                  # Instructions to build the container image
├── package.json                # Project dependencies and scripts
├── package-lock.json           # Lockfile for dependencies
└── server.js                   # Main backend server file (Express app)
```

## Setup and Installation (Local Development)

Follow these steps to run the application on your local machine for development or testing.

1.  **Get the Code:** Clone the repository (if using Git) or ensure you have the project code in a local folder (e.g., `O:\newD\comp`).
2.  **Navigate to Directory:** Open your terminal or PowerShell and navigate to the project's root directory:
    ```powershell
    cd path\to\competition-app # Example: cd O:\newD\comp
    ```
3.  **Create Environment File (`.env`):** Create a file named `.env` in the project root. **This file is crucial and should NEVER be committed to Git.** Copy the structure below and fill in your actual credentials:

    ```dotenv
    # MongoDB Connection String (Get from Atlas)
    MONGODB_URI=mongodb+srv://[DB_USER]:[DB_PASSWORD]@[YOUR_CLUSTER_URI]/?retryWrites=true&w=majority&appName=[YOUR_APP_NAME]

    # Razorpay API Keys (Use Test Keys for Local Dev)
    RAZORPAY_KEY_ID=rzp_test_**************
    RAZORPAY_KEY_SECRET=********************

    # Admin Login Key
    ADMIN_KEY=admin121212 # Change this for production!

    # Server Port (Cloud Run uses 8080 often, can be 3000 for local)
    PORT=8080

    # Google Cloud Storage Bucket Name (Must be globally unique)
    GCS_BUCKET_NAME=your-unique-bucket-name-here # e.g., sunmax-comp-uploads-agra-2025

    # Node Environment (Optional for local, set to production in Cloud Run)
    # NODE_ENV=development
    ```
    * Replace placeholders like `[DB_USER]`, `[DB_PASSWORD]`, `[YOUR_CLUSTER_URI]`, Razorpay keys, and the GCS bucket name.
4.  **Install Dependencies:** Run the following command to install all necessary Node.js packages:
    ```powershell
    npm install
    ```
5.  **Configure MongoDB Atlas IP Access:** Log in to MongoDB Atlas. Go to "Network Access". Ensure your current public IP address is whitelisted OR allow access from anywhere (`0.0.0.0/0` - less secure, okay for testing). This allows your local machine to connect.
6.  **Run the Application:** Start the Node.js server:
    ```powershell
    npm start
    ```
    *(If you configured a `dev` script with `nodemon`, you might use `npm run dev`)*
7.  **Access Locally:** Open your web browser and navigate to `http://localhost:8080` (or the port specified in your `.env` file).

## Cloud Setup (GCP & Related Services)

This section details the setup required on Google Cloud Platform and other services before deployment.

### 1. GCP Project Setup

* Ensure you have selected the correct GCP Project where you want to deploy. Note down your **Project ID** (e.g., `triple-reef-453214-e6`).
* Verify **Billing** is enabled for the project.
* Set your active project in the `gcloud` CLI (if not already set):
    ```powershell
    gcloud config set project YOUR_PROJECT_ID
    # Example: gcloud config set project triple-reef-453214-e6
    ```

### 2. Enable Necessary GCP APIs

APIs provide access to specific Google Cloud services. You need to enable them for your project.

* Run the following command in PowerShell (ensure you have necessary IAM permissions - e.g., 'Editor' or 'Service Usage Admin' role - in your project):
    ```powershell
    gcloud services enable run.googleapis.com storage.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com iam.googleapis.com --project=YOUR_PROJECT_ID
    ```
![image](https://github.com/user-attachments/assets/a5ad19c0-8dc0-43eb-aeab-9370fa61c88a)

### 3. MongoDB Atlas Setup

* **Create Cluster:** If you haven't already, create a free M0 tier cluster in MongoDB Atlas. Choose a region close to your users or your Cloud Run region.
* **Create Database User:** Go to "Database Access" and create a user with read/write privileges. Securely note the username and password.
* **Configure Network Access:** Go to "Network Access". Add an entry `0.0.0.0/0` to allow connections from any IP address. This is necessary for Cloud Run instances (whose IPs change) to connect. For higher security, you might explore VPC Peering or Private Endpoints later.

  ![image](https://github.com/user-attachments/assets/a7ded06b-b02f-4d2d-9a7a-0f37107a69a7)

* **Get Connection String:** Go to your cluster's "Connect" -> "Connect your application" section. Select the Node.js driver version. Copy the connection string (`mongodb+srv://...`). Replace the `<username>` and `<password>` placeholders with the credentials you created. Use this full string for the `MONGODB_URI` in your `.env` file and later in Cloud Run environment variables.

### 4. Google Cloud Storage (GCS) Bucket Setup

This bucket will store the files uploaded by participants.

* **Choose a Bucket Name:** Select a **globally unique** name (e.g., `sunmax-comp-uploads-agra-2025`). Use lowercase letters, numbers, dashes. Note this name down for your `.env` file and Cloud Run variables.
* **Choose a Region:** Select a region (e.g., `asia-south1` - Mumbai).
* **Create Bucket (PowerShell):**
    ```powershell
    # Replace 'your-unique-bucket-name-here' and 'asia-south1' if needed
    gsutil mb -p YOUR_PROJECT_ID -l asia-south1 gs://your-unique-bucket-name-here/
    ```
    ![image](https://github.com/user-attachments/assets/2d5a29da-55fb-49e1-9f0a-ba2a6c5fa99c)

* **Set Permissions for Public Read Access:** This allows the application (and admin downloads) to easily access the files via URL.
    ```powershell
    # Replace 'your-unique-bucket-name-here' with your actual bucket name
    gsutil uniformbucketlevelaccess set on gs://your-unique-bucket-name-here/
    gsutil iam ch allUsers:objectViewer gs://your-unique-bucket-name-here/

    
    ```
    * **Note:** This makes all uploaded files publicly readable via their URL. For sensitive data, consider keeping files private and using Signed URLs for downloads (requires code changes).

### 5. Artifact Registry Repository Setup

This repository stores your built container images.

* **Choose a Repository Name:** e.g., `competition-repo`.
* **Choose a Region:** Typically match your GCS bucket or primary development region (e.g., `asia-south1`).
* **Create Repository (PowerShell):**
    ```powershell
    # Replace region/repo name if desired, ensure project ID is correct
    gcloud artifacts repositories create competition-repo `
        --repository-format=docker `
        --location=asia-south1 `
        --description="Docker repository for competition app" `
        --project=YOUR_PROJECT_ID
    ```
![image](https://github.com/user-attachments/assets/e3ebf7c8-3863-4b5c-a372-dc5450c7e718)

## Containerization (Dockerfile)

The `Dockerfile` contains instructions to package the Node.js application into a portable container image.

```dockerfile
# Dockerfile content (paste complete Dockerfile here)

# Use an official Node.js runtime as a parent image
# Choose a version compatible with your code (e.g., Node 18 or 20)
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
# This layer is cached and only re-runs if these files change
COPY package*.json ./

# Install app dependencies
# Use --only=production to install only production dependencies
RUN npm install --only=production --ignore-scripts

# Bundle app source inside the Docker image
COPY . .

# Make port 8080 available to the world outside this container
# Cloud Run will map requests to this port
EXPOSE 8080

# Define the command to run your app using Node
# Use ["node", "server.js"] instead of npm start for better signal handling
CMD [ "node", "server.js" ]
```

The `.dockerignore` file prevents unnecessary files from being copied into the image:

```dockerignore
# .dockerignore content (paste complete .dockerignore here)
.git
node_modules
npm-debug.log
*.log
.env
Dockerfile
.dockerignore
README.md
```

## Building & Pushing the Container Image

This step uses Google Cloud Build to create the container image from your code and Dockerfile, then pushes it to the Artifact Registry repository you created.

1.  Make sure you are in your project's root directory (e.g., `O:\newD\comp`) in your Administrator PowerShell terminal.
2.  Run the build command:
    ```powershell
    # Replace values if you used different names/regions
    gcloud builds submit --tag asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/competition-repo/competition-app:latest . --project=YOUR_PROJECT_ID
    ```
    *Explanation: This tag points to the Artifact Registry repository located in `asia-south1`. Cloud Build will build the image and store it there.*
3.  Wait for the build to complete successfully.
![image](https://github.com/user-attachments/assets/fa33e364-e0b5-48d5-9573-1f1479bfad9e)

## Deploying to Google Cloud Run

This deploys your container image as a scalable web service.

### Initial Deployment & Region Issue

An initial deployment attempt to `asia-south1` revealed that direct custom domain mapping is not supported in that region for this service configuration.
![image](https://github.com/user-attachments/assets/7bb42147-fcca-45b1-b1fc-d6ef551d56a5)

### Redeployment to Supported Region (`us-central1`)

To enable custom domain mapping, the service was redeployed to `us-central1`.

1.  Run the deploy command in your Administrator PowerShell terminal from the project root:
    ```powershell
    # Command to deploy the service to us-central1
    # Ensure all env vars are correct, especially YOUR_GCS_BUCKET_NAME
    gcloud run deploy competition-app `
        --image asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/competition-repo/competition-app:latest `
        --platform managed `
        --region us-central1 `
        --port 8080 `
        --allow-unauthenticated `
        --project=YOUR_PROJECT_ID `
        --set-env-vars="MONGODB_URI=[YOUR_MONGODB_ATLAS_CONNECTION_STRING]" `
        --set-env-vars="RAZORPAY_KEY_ID=[YOUR_RAZORPAY_TEST_KEY_ID]" `
        --set-env-vars="RAZORPAY_KEY_SECRET=[YOUR_RAZORPAY_TEST_KEY_SECRET]" `
        --set-env-vars="ADMIN_KEY=[YOUR_CHOSEN_ADMIN_KEY]" `
        --set-env-vars="GCS_BUCKET_NAME=[YOUR_UNIQUE_GCS_BUCKET_NAME]" `
        --set-env-vars="NODE_ENV=production"
    ```
    *Replace placeholders `[YOUR_...]` with your actual values.*
2.  Confirm prompts with `Y`.
3.  Wait for deployment to finish. Note the Service URL provided (e.g., `https://competition-app-....-uc.a.run.app`).
![image](https://github.com/user-attachments/assets/9a1dc8a2-f3bd-4e6e-aa17-835fa2a526bc)

### (Optional but Recommended) Cleanup Old Service

If you successfully deployed to `asia-south1` initially, delete that unused service:
```powershell
# Command to DELETE the service in asia-south1
gcloud run services delete competition-app --region=asia-south1 --project=YOUR_PROJECT_ID
```
![image](https://github.com/user-attachments/assets/2668a07d-10a3-401d-8ff2-d0395ad736cc)

## DNS & Custom Domain Setup (`competition.sunmax.live`)

This maps your user-friendly subdomain to the deployed Cloud Run service.

### 1. Configure DNS at Provider (Netlify)

Since `sunmax.live` uses Netlify nameservers, DNS records must be added in the Netlify UI. Attempts to add records at the registrar (Name.com) will fail.
![image](https://github.com/user-attachments/assets/1e8c5817-ea11-4295-bb72-2bbaeec2bac3)

* **Add CNAME Record:**
    1.  Log in to Netlify -> Domains -> `sunmax.live` -> DNS Panel.
    2.  Add a new record:
        * **Type:** `CNAME`
        * **Name:** `competition`
        * **Value:** `ghs.googlehosted.com.` (Include the trailing dot!)
        * **TTL:** Default
    3.  Save the record.
![image](https://github.com/user-attachments/assets/382e7fe0-8fa0-422e-83bf-a2f7ad1cceee)

### 2. Map Domain in Cloud Run

1.  Go to Google Cloud Console -> Cloud Run -> `competition-app` service (ensure `us-central1` region is viewed).
2.  Navigate to the "Networking" tab -> Custom Domains -> "Add Mapping".
3.  Enter the full subdomain: `competition.sunmax.live`.
4.  Click Continue.
5.  **Verification:** Google will provide details for a verification record (usually TXT). Copy these details.
6.  **Add Verification Record in Netlify:** Go back to Netlify DNS panel for `sunmax.live`. Add the TXT record exactly as specified by Google (e.g., Name might be `@` or `_google-site-verification`, Value will be a unique string). Save it.
7.  **Verify in Cloud Run:** Go back to the Cloud Run mapping page and click "Verify". This may take a few minutes for DNS propagation.
8.  **SSL Provisioning:** Once verified, Cloud Run automatically provisions an SSL certificate. Wait for the status to become "Active" or "Serving".
![image](https://github.com/user-attachments/assets/94cc0a57-ead4-485c-90e9-4bad10da430e)
![image](https://github.com/user-attachments/assets/53fd6942-8a07-4cee-a22c-65f5ba9eda6d)


### 3. Test Custom Domain

1.  Wait ~15-30 minutes after mapping shows active.
2.  Clear browser cache / use Incognito mode.
3.  Try accessing `https://competition.sunmax.live`.
4.  If `ERR_CONNECTION_CLOSED` occurs, re-check DNS propagation (dnschecker.org), wait longer, test the direct `.run.app` URL, and check Cloud Run logs if necessary.

## Payment Gateway Setup (Razorpay)

Configuration for accepting payments.

* **Test Keys:** Use your Razorpay Test Key ID and Secret in your local `.env` file and in the Cloud Run environment variables during initial deployment and testing.
* **Compliance for Live Keys:** Razorpay requires website verification. Ensure `https://competition.sunmax.live` meets their requirements:
    * **Contact Us:** Footer includes Email, Phone, Address (City, State minimum).
    * **Product/Pricing:** Competition details and "₹100 Entry Fee" clearly displayed.
    * **Theme/Content:** Professional appearance ("Sunmax AI" branding), no government references.
    * **Images:** No dummy/placeholder images.
    * **Policy Links:** Footer links to Privacy Policy, Terms of Service, Cancellation & Refunds, Data Deletion pages (hosted on `sunmax.live`).
    * **Business Name:** Website footer/contact should ideally match or clarify the Registered Business Name listed in your Razorpay profile (resolve the "BOCOVO" issue by checking profile/contacting support).
    * **Redirections:** No unnecessary redirects on the site.
* **Submit for Review:** Submit `https://competition.sunmax.live` to Razorpay for live key activation review. Clearly state this is the operational URL.
* **Live Keys:** Once approved, generate Live API Key ID and Secret from the Razorpay dashboard.
* **Update Cloud Run Environment:** Crucially, update the `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` environment variables in your Cloud Run service with the **LIVE** keys. You can do this by:
    * Editing the service via the Cloud Console UI (Go to Cloud Run -> `competition-app` -> Edit and deploy new revision -> Variables tab).
    * OR Re-running the `gcloud run deploy...` command, changing only the values for the Razorpay key variables.

## OAuth Configuration Updates (Google/Facebook Login)

After setting up the custom domain (`https://competition.sunmax.live`), you must update your OAuth provider settings to allow logins from this new URL.

### Google Login

1.  Go to Google Cloud Console -> APIs & Services -> Credentials.
2.  Select the correct project.
3.  Find and edit your OAuth 2.0 Client ID used for web sign-in.
4.  Add `https://competition.sunmax.live` to "Authorized JavaScript origins".
5.  Add `https://competition.sunmax.live/YOUR_CALLBACK_PATH` (replace with your actual path, e.g., `/auth/google/callback`) to "Authorized redirect URIs".
6.  Save changes.

### Facebook Login

1.  Go to Facebook Developer Dashboard -> Your App (sunmaxai).
2.  Navigate to Products -> Facebook Login -> Settings.
3.  Add `https://competition.sunmax.live/YOUR_CALLBACK_PATH` (replace with your actual path, e.g., `/auth/facebook/callback`) to "Valid OAuth Redirect URIs".
4.  Ensure `competition.sunmax.live` (or maybe just `sunmax.live`) is listed under Settings -> Basic -> App domains.
5.  Save changes.

## Updating the Deployed Application

When you make changes to the code (frontend or backend):

1.  **Save Changes Locally:** Ensure all your code edits are saved in your project directory (e.g., `O:\newD\comp`).
2.  **Rebuild the Container Image:** Open Administrator PowerShell, navigate to your project directory, and run:
    ```powershell
    gcloud builds submit --tag asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/competition-repo/competition-app:latest . --project=YOUR_PROJECT_ID
    ```
    *(Wait for SUCCESS)*
3.  **Redeploy the Cloud Run Service:** Run the deploy command again (using the `us-central1` region and your correct environment variables). This will roll out a new revision with the updated image.
    ```powershell
    # Use the SAME deploy command you used successfully before, ensuring region and env vars are correct
    gcloud run deploy competition-app `
        --image asia-south1-docker.pkg.dev/YOUR_PROJECT_ID/competition-repo/competition-app:latest `
        --platform managed `
        --region us-central1 `
        --port 8080 `
        --allow-unauthenticated `
        --project=YOUR_PROJECT_ID `
        --set-env-vars="..." # Include ALL required env vars again
    ```
    *(Wait for deployment)*
4.  **Test:** Clear browser cache and test the live URL (`https://competition.sunmax.live`).

## Troubleshooting Tips

* **Check Cloud Run Logs:** Go to your service in Cloud Run -> Logs tab. Filter by severity (Error, Warning) to find application or container startup issues.
* **Check Browser DevTools:** Open your browser's developer tools (usually F12). Check the Console tab for frontend JavaScript errors and the Network tab for failed API requests (check status codes like 4xx, 5xx).

* SOME PARTS OR OPTIONAL SO DONT WORRY 
* **Verify Environment Variables:** In the Cloud Run UI, edit your service revision and check the "Variables & Secrets" tab to ensure all environment variables (DB URI, API Keys, Bucket Name, etc.) are correctly set.
* **Check DNS Propagation:** Use dnschecker.org to verify your CNAME (`competition`) and TXT (verification) records are visible globally.
* **`gcloud` Command Errors:** Double-check project IDs, regions, repository names, service names, and ensure you are running commands from the correct directory with sufficient permissions (Administrator PowerShell if needed).
