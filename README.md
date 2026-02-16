
# ✍️ Real-Time Collaborative Document Editor - CODTECH Internship Task 3

This is a real-time collaborative document editing platform developed as part of **Task 3** for the Full Stack Web Development Internship at **CODTECH IT SOLUTIONS PVT. LTD**. It allows multiple users to create, edit, and collaborate on text documents in real-time.

---

## 🏢 Internship Details

- **Name**: Boya Mounika  
- **Intern ID**: CT08DM760  
- **Domain**: Full Stack Web Development  
- **Company**: CODTECH IT SOLUTIONS PVT. LTD  
- **Task**: 3 — Real-Time Collaborative Document Editor  
- **Internship Duration**: May 12, 2025 – July 12, 2025  

---

## 🧠 Project Overview

This platform supports **live collaboration** among multiple users through **WebSocket-based synchronization**. It features:

- Real-time document editing
- User authentication
- Document creation and persistence
- Version tracking *(optional)*
- Seamless and responsive UI

---
<img width="1893" height="1026" alt="Screenshot 2025-07-12 171318" src="https://github.com/user-attachments/assets/8da85813-2d59-4689-879e-86454db5cfce" />



<img width="1900" height="1027" alt="Screenshot 2025-07-12 171721" src="https://github.com/user-attachments/assets/6c9ef631-e86d-4f73-8e2b-42fa4c75f7c4" />


## ✨ Key Features
- 🧑‍🤝‍🧑 **Multi-User Editing**: Real-time changes reflected instantly across connected users.
- 📝 **Document Creation**: Users can create, name, and manage multiple documents.
- 🔒 **Authentication**: Secure login/signup using email and password.
- 📜 **Data Persistence**: All document changes are saved to the database.
- 🧭 **Navigation Panel**: Easy switch between multiple documents.
- 📊 **Live Cursors/Highlights** *(optional)*: See collaborators' cursors and selections in real-time.

---

## 🛠️ Tech Stack

| Layer         | Technology                            |
|---------------|----------------------------------------|
| **Frontend**  | React.js / Vue.js                      |
| **Backend**   | Node.js + Express / Django / Flask     |
| **Database**  | MongoDB / PostgreSQL                   |
| **Real-Time** | Socket.IO / WebSockets                 |
| **Authentication** | Firebase Auth / JWT               |
| **Deployment**| Vercel, Netlify (Frontend) + Render / Railway / Heroku (Backend) |

---

## 🧩 Folder Structure (React + Node.js Example)

```

real-time-editor/
├── client/                     # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.js
│   └── package.json
│
├── server/                     # Node.js Backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── socket.js
│   ├── index.js
│   └── package.json
│
├── README.md
└── .env

````

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/realtime-doc-editor.git
cd realtime-doc-editor
````

### 2. Setup the server

```bash
cd server
npm install
npm run dev
```

### 3. Setup the client

```bash
cd client
npm install
npm start
```


## 🔐 Authentication Options

* Firebase Auth (Email/Password)
* JWT-based login system via backend

---

## 🛡️ Security & Performance

* Input sanitization to avoid script injections
* Optimized socket connection handling
* Auto-save on document change

---

## 📬 Contact

* 📧 Email: \[189mounika.b@gmail.com]
* 💼 LinkedIn: \(https://www.linkedin.com/in/boya-mounika-21964b26a/)
* 🐙 GitHub: \ [(https://github.com/boyamounika9)]


This project is developed for academic and training purposes under the Full Stack Web Development Internship at **CODTECH IT SOLUTIONS PVT. LTD**.
