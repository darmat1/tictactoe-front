# 📱 Tic-Tac-Toe Client (Telegram Mini App)

A modern, responsive frontend for the Tic-Tac-Toe game, designed to run natively inside **Telegram**.

## ✨ Features

- **Telegram Integration**: Uses `@twa-dev/sdk` for native look and feel.
- **Real-time Updates**: Instant sync with the server via Socket.io.
- **Responsive UI**: Optimized for mobile devices.
- **Visual Feedback**: Dynamic win lines, status updates, and turn indicators.
- **Environment Management**: Configurable backend URL via Vite envs.

## 🛠 Tech Stack

- **Core**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **Styling**: CSS Modules
- **Integration**: Telegram Web Apps SDK

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd tictactoe-front
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory:
   ```env
   VITE_BACKEND_URL=http://localhost:3000
   # Or your production URL:
   # VITE_BACKEND_URL=https://your-backend.onrender.com
   ```

4. **Run Locally**
   ```bash
   npm run dev
   ```

## 📲 How to test in Telegram