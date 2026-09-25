# PaySplit — Automated Payment Splitting Platform 🚀

A modern, high-performance UPI & Payment Gateway dynamic splitting terminal for multi-vendor merchants and retail counters.

PaySplit automatically splits large bills into multiple dynamic QR codes based on merchant limits (e.g. ₹1,999) or custom portion counts, displays live scannable QR codes for customers, and automatically updates the vendor's terminal screen with real-time green ticks upon payment completion via Server-Sent Events (SSE) and webhooks.

---

## ✨ Features

- **⚡ Automated Dynamic UPI Splitting**: Split any bill amount into 2, 3, 4, or auto-calculated QR codes within per-transaction limits.
- **📱 Mobile-First POS Terminal**: Clean, responsive touch interface optimized for vendor mobile phones at retail counters.
- **🟢 Instant Real-Time Green Ticks**: As soon as a customer scans and pays in Google Pay, PhonePe, Paytm, or any UPI app, the QR code on the vendor screen directly flips into a Green Tick (`Paid ✓`) with a soundbox audio chime.
- **🎉 Zero-Touch Final Settlement**: Vendors never have to manually verify each transaction. Once all portions are received, the screen displays the **Final One Big Green Tick**.
- **📊 Customer Information Tracking**: Records customer name and mobile number on every bill, displayed in live History & Stats and detailed breakdown modals.
- **💳 Payment Gateway Ready**: Built-in support for **Razorpay Dynamic UPI QR Codes** with automatic webhook verification.
- **🛡️ Multi-Role Security**: Admin console with vendor approvals, custom max split limits, and real-time support chat.
- **⚖️ Compliance Ready**: Pre-built policy pages (*Terms & Conditions*, *Privacy Policy*, *Refund Policy*, *Contact Us*) for payment gateway merchant verification.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti, QR Code Generator
- **Backend**: Node.js, Express 5, MongoDB Atlas (Mongoose), Server-Sent Events (SSE), Crypto HMAC-SHA256
- **Deployment**: Vercel (Frontend), Render / Railway / Node (Backend)

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas or local MongoDB instance

### 2. Clone Repository
```bash
git clone https://github.com/Karan-desai-7299/PaySplit-Automated-Payment-Splitting-Platform.git
cd PaySplit-Automated-Payment-Splitting-Platform
```

### 3. Setup Backend
```bash
cd server
npm install
# Configure your environment variables in server/.env
npm start
```

### 4. Setup Frontend
```bash
cd ../client
npm install
npm run dev
```
Open **http://localhost:5173** in your browser.

---

## 🌐 Deploy to Vercel (Frontend)

1. Import your GitHub repository into **[Vercel](https://vercel.com/)**.
2. Select Framework Preset: **Vite**.
3. Set Root Directory to `./client` (or use the root `vercel.json` provided).
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add Environment Variable:
   - `VITE_API_BASE`: `https://your-backend-api-url.com/api` (or leave empty if using server proxy)
7. Click **Deploy**!

---

## 👤 Author & Support

- **Developer & Owner**: **Karansinh Desai**
- **Mobile / Helpline**: +91 88306 78600
- **Email**: karansinhdesai91@gmail.com
- **LinkedIn**: [linkedin.com/in/karansinh-desai](https://www.linkedin.com/in/karansinh-desai/)
- **Portfolio**: [karansinh-portfolio.vercel.app](https://karansinh-portfolio.vercel.app/)

---

## 📄 License
This project is licensed under the ISC License.
