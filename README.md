# Double OT Approval - Frontend Application

Built with **React (Vite)**, **Tailwind CSS**, **Lucide Icons**, and **Recharts**.

## 🚀 Live Backend API
The frontend is configured to connect directly to the live backend hosted on Render:
- **Render Backend URL:** `https://dot-backend-16ps.onrender.com/api`

## 🛠️ Local Development
```bash
# Install dependencies
npm install

# Start development server (Port 3000)
npm run dev
```

## 📦 Production Build
```bash
npm run build
```
The output will be in the `dist/` directory.

## 🌐 Deploy to Vercel / Netlify
1. Connect this repository (`https://github.com/dilankasltl/dot-frontedn.git`).
2. Build command: `npm run build`
3. Output directory: `dist`
4. Environment variable (optional, already default in code):
   `VITE_API_URL=https://dot-backend-16ps.onrender.com/api`
