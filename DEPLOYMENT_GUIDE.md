# 🚀 PaySplit — Production Deployment Guide

**PaySplit — Automated Payment Splitting Platform** is fully configured and ready for production deployment.

The project is architected so that:
1. **Single-Service Deploy**: The Node.js backend can serve the compiled React SPA directly from `client/dist` on a single port (zero CORS configuration needed).
2. **Split-Service Deploy**: You can host the frontend on Vercel/Netlify and the backend on Render/Railway/AWS/Cloud Run.

---

## 📋 Pre-Deployment Checklist Status

- [x] **Production Build Verified**: `npm run build` generates optimized assets in `client/dist` (Gzipped bundle < 100kB).
- [x] **Database Ready**: Connected to remote MongoDB Atlas cluster.
- [x] **Authentication**: 30-Day continuous JWT sessions (`JWT_EXPIRES_IN=30d`).
- [x] **Real-Time Streaming**: Server-Sent Events (SSE) active for zero-delay payment green ticks and live vendor-admin chat.
- [x] **Static SPA Serving**: `server/index.js` automatically serves the production frontend build when present.
- [x] **Admin Auto-Seed**: Administrator account (`admin` / `admin@123`) automatically ready on first run.

---

## 🌐 Deployment Options

### Option 1: Render / Railway (Recommended — Free / Low Cost, 1-Click)

You can deploy the entire app as **one single web service**:

1. Push your code to a GitHub repository.
2. In **Render** (or **Railway**), create a **New Web Service** and connect your GitHub repo.
3. Configure settings:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   - `PORT`: `5000` (or left to provider default)
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `your_mongodb_connection_string`
   - `JWT_SECRET`: `your_secret_random_string`
   - `JWT_EXPIRES_IN`: `30d`
   - `ADMIN_USERNAME`: `admin`
   - `ADMIN_PASSWORD`: `admin@123`
5. Click **Deploy**. Your entire application (Frontend + Backend) will be live on `https://your-app.onrender.com`!

---

### Option 2: Self-Hosted VPS (Ubuntu, Hostinger, DigitalOcean, AWS EC2)

1. SSH into your server:
   ```bash
   ssh root@your-server-ip
   ```
2. Clone your repository:
   ```bash
   git clone <your-repo-url> /var/www/paysplit
   cd /var/www/paysplit
   ```
3. Install dependencies & build frontend:
   ```bash
   npm run build
   cd server && npm install --production
   ```
4. Configure `.env` in `/var/www/paysplit/server/.env`:
   ```env
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_strong_secret
   JWT_EXPIRES_IN=30d
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your_strong_password
   ```
5. Run with PM2 (daemon process manager):
   ```bash
   npm install -g pm2
   pm2 start index.js --name "paysplit"
   pm2 startup
   pm2 save
   ```
6. Set up Nginx Reverse Proxy with SSL (Certbot free HTTPS):
   ```nginx
   server {
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           
           # SSE Streaming support (no buffering)
           proxy_set_header Connection '';
           chunked_transfer_encoding off;
           proxy_buffering off;
           proxy_cache off;
       }
   }
   ```
   Run: `certbot --nginx -d yourdomain.com`

---

### Option 1: Vercel (Deploy Both Frontend & Backend from One GitHub Repo)

You can deploy **both Frontend and Backend as 2 connected projects** directly on Vercel using your GitHub repository:
👉 `https://github.com/Karan-desai-7299/PaySplit-Automated-Payment-Splitting-Platform`

#### Step A: Deploy the Backend on Vercel
1. Go to **[vercel.com/new](https://vercel.com/new)** and import your GitHub repo `PaySplit-Automated-Payment-Splitting-Platform`.
2. Configure Project:
   - **Project Name**: `paysplit-backend`
   - **Root Directory**: Click *Edit* and select **`server`**
   - **Framework Preset**: `Other`
3. Add **Environment Variables**:
   - `MONGODB_URI`: `your_mongodb_atlas_connection_string`
   - `JWT_SECRET`: `your_random_secret_key`
   - `NODE_ENV`: `production`
   *(You will add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` here later after Razorpay generates them)*
4. Click **Deploy**.
5. Once deployed, copy your live backend URL (e.g., `https://paysplit-backend.vercel.app`).
   Verify it by opening `https://paysplit-backend.vercel.app/health` in your browser.

---

#### Step B: Deploy the Frontend on Vercel
1. Go to **[vercel.com/new](https://vercel.com/new)** again and import the same GitHub repo `PaySplit-Automated-Payment-Splitting-Platform`.
2. Configure Project:
   - **Project Name**: `paysplit-frontend`
   - **Root Directory**: Click *Edit* and select **`client`**
   - **Framework Preset**: `Vite`
3. Add **Environment Variable**:
   - `VITE_API_BASE`: `https://paysplit-backend.vercel.app/api` *(replace with your actual Step A backend URL)*
4. Click **Deploy**.
5. You will get your live frontend URL (e.g., **`https://paysplit-frontend.vercel.app`**)!

---

### 💳 Step C: Submit Live Frontend Link to Razorpay for API Keys

1. Log in to your **[Razorpay Dashboard](https://dashboard.razorpay.com/)**.
2. Go to **Account & Settings** → **Website & App Settings** / **Business Profile**.
3. Under **Website URL**, enter your live frontend link:
   👉 `https://paysplit-frontend.vercel.app`
4. Razorpay will verify that your website has:
   - ✅ Terms & Conditions (Already added in your footer!)
   - ✅ Privacy Policy (Already added in your footer!)
   - ✅ Refund & Cancellation Policy (Already added in your footer!)
   - ✅ Contact Us with Owner Details (Karansinh Desai, `+91 88306 78600`, `karansinhdesai91@gmail.com`)
5. Once submitted, toggle from **Test Mode** to **Live Mode** in Razorpay and generate your **Key ID** and **Key Secret**.

---

### ⚙️ Step D: Update `.env` in Vercel with Razorpay Keys

1. In your Vercel Dashboard, go to your **`paysplit-backend`** project.
2. Go to **Settings** → **Environment Variables**.
3. Add your new keys:
   - `RAZORPAY_KEY_ID`: `rzp_live_xxxxxxxx`
   - `RAZORPAY_KEY_SECRET`: `your_razorpay_secret`
4. Go to the **Deployments** tab and click **Redeploy** (so the new environment variables take effect).
5. Done! Your entire automated payment splitting platform is now fully live with real Razorpay integration.

---

## 🔒 Security Recommendations for Production

1. **Change Admin Password**:
   - Change default admin password (`admin@123`) immediately after deployment via the Admin Console or in `.env`.
2. **Use HTTPS**:
   - UPI deep links and modern mobile browsers require SSL (`https://`) in production.
3. **Webhook Secret**:
   - When connecting a live payment gateway (Razorpay/Paytm/Cashfree), verify their webhook cryptographic signatures at `/api/webhook/payment`.
