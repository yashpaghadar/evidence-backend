# DDFEMS Backend Server

Backend server for the **Digital Forensics Evidence Management System (DDFEMS)**. It provides REST APIs for storing and verifying digital evidence using **Firebase Firestore** and **SHA-256 hashing**.

## 🚀 Live API

**Base URL:**  
https://evidence-backend-g0t5.onrender.com

---

## ✨ Features

- Store evidence hash in Firestore
- Verify evidence integrity using SHA-256
- Firebase Firestore integration
- RESTful APIs
- Express.js backend
- Deployed on Render

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- Firebase Admin SDK
- Cloud Firestore
- Crypto (SHA-256)

---

## 📂 Project Structure

```text
backend-server/
├── node_modules/
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
├── server.js
└── serviceAccountKey.json
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Server status |
| POST | `/storeBlockchain` | Store evidence hash |
| POST | `/verifyEvidence` | Verify evidence integrity |

---

## 📥 Sample Request

### Store Blockchain

```http
POST /storeBlockchain
```

```json
{
  "evidenceId": "EVD_001"
}
```

### Verify Evidence

```http
POST /verifyEvidence
```

```json
{
  "evidenceId": "EVD_001"
}
```

---

## ▶️ Run Locally

```bash
git clone https://github.com/yashpaghadar/evidence-backend.git
cd evidence-backend

npm install
npm start
```

Create a `.env` file with:

```env
PORT=3000
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

---

## 👨‍💻 Author

**Yash K. Paghadar**

Diploma in Information Technology

**Project:** Digital Forensics Evidence Management System (DDFEMS)

---

## 📄 License

This project is intended for educational and academic purposes.