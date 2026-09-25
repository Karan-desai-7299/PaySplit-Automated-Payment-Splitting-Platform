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

### Option 3: Vercel (Frontend) + Render/Railway (Backend)

- **Frontend on Vercel**:
  - Root directory: `client`
  - Framework: `Vite`
  - Environment variable: `VITE_API_BASE=https://your-backend-url.onrender.com/api`
- **Backend on Render**:
  - Root directory: `server`
  - Build command: `npm install`
  - Start command: `node index.js`
  - Add your MongoDB Atlas URI & JWT secret.

---

## 🔒 Security Recommendations for Production

1. **Change Admin Password**:
   - Change default admin password (`admin@123`) immediately after deployment via the Admin Console or in `.env`.
2. **Use HTTPS**:
   - UPI deep links and modern mobile browsers require SSL (`https://`) in production.
3. **Webhook Secret**:
   - When connecting a live payment gateway (Razorpay/Paytm/Cashfree), verify their webhook cryptographic signatures at `/api/webhook/payment`.
