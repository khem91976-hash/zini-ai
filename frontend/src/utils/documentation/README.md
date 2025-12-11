# Zini AI - SaaS Chat Application

Zini AI is a production-ready AI SaaS platform featuring Voice Chat, Image Generation, and a Real-Time Admin Dashboard.

## 🚀 Prerequisites

1.  **Node.js** (v18 or higher)
2.  **MongoDB** (Local or Atlas URI)
3.  **Google Gemini API Key** (Required for AI features)

## 📦 Project Structure

The project is organized into two main folders:

*   **`backend/`**: Node.js & Express API Server.
*   **`frontend/`**: React, Vite, & Tailwind CSS Client.

## 🛠️ Installation & Running

### 1. Backend Setup

1.  Navigate to the backend folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables in `.env`:
    ```env
    MONGO_URI=mongodb://127.0.0.1:27017/zini_ai
    API_KEY=your_gemini_api_key
    ```
4.  Start the backend server:
    ```bash
    npm start
    ```
    *Server runs on port 5000.*

### 2. Frontend Setup

1.  Open a new terminal and navigate to the frontend folder:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    *Frontend runs on port 5173 and proxies API requests to port 5000.*

## ✨ Key Features

-   **Voice Chat:** Talk to Zini using Web Speech API.
-   **Text-to-Speech:** Zini speaks back to you.
-   **Image Mode:** Generate images using AI (costs 5 credits).
-   **Admin Panel:** View real-time online users via Socket.io and manage user credits.
-   **Credit System:** Built-in economy for monetization.

## 🔑 Default Admin

*   **Username:** `admin`
*   **Password:** `zinikhem`
