# Automated One-Click Live Deployments Guide

This repository is pre-configured for automated live deployments to **Render**, **Google Cloud Run**, or **Railway** via GitHub.

---

## 1. Push to your GitHub Account

1. Create a new empty repository on GitHub: [https://github.com/new](https://github.com/new)  
   - Suggested name: `cuny-sps-club-social-hub`
   - Keep it **Public** or **Private** (do not initialize with README/license, as we already have one).

2. Link and push your local repository (replace `YOUR_USERNAME` with your GitHub username):
   ```powershell
   git remote add origin https://github.com/YOUR_USERNAME/cuny-sps-club-social-hub.git
   git push -u origin main
   ```

---

## 2. Connect to Render (Free Web Service)

1. Sign in to [Render.com](https://render.com) (sign in with your GitHub account).
2. Click **New +** > **Web Service**.
3. Select your repository `cuny-sps-club-social-hub`.
4. Render will automatically detect the settings from `render.yaml`:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variable**: Add `GEMINI_API_KEY` (from your Google AI Studio API key).
5. Click **Create Web Service**.

Within 2 minutes, you will get a permanent live public URL, for example:  
👉 `https://cuny-sps-club-social-hub.onrender.com`

---

## 3. Alternative: Google Cloud Run (Container)

1. In Google Cloud Console, navigate to **Cloud Run**.
2. Click **Deploy Container** > **Continuously deploy from a repository**.
3. Select your GitHub repo and branch `main`.
4. Cloud Run will use the included multi-stage `Dockerfile` to build and deploy your container on Google Cloud.

---

## 4. How Future Live Changes Work

Whenever any changes are made to the codebase:
```powershell
git commit -am "Update features"
git push
```
Render / Cloud Run will automatically trigger a build and publish the changes to your live website immediately!
