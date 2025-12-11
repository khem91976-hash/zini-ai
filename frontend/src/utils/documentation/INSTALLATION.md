# Detailed Installation Guide

## Step 1: Database Setup
Ensure you have MongoDB installed locally or have a MongoDB Atlas connection string.
- If local, ensure it is running on `mongodb://127.0.0.1:27017`.

## Step 2: Backend Configuration
1. Go to `backend/.env`.
2. Paste your Google Gemini API Key in `API_KEY`.
3. (Optional) Change `JWT_SECRET` for production security.

## Step 3: Running the App
You need two terminals open.

**Terminal 1 (Backend):**
```bash
cd backend
npm install
npm start
```
You should see: `🚀 Zini AI Server running on http://localhost:5000`

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```
You should see: `Local: http://localhost:5173/`

## Step 4: Login
Open your browser to `http://localhost:5173`.
Login with:
- **User:** `admin`
- **Pass:** `zinikhem`
