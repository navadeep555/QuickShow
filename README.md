# 🎬 QuickShow

<div align="center">

**A full-stack movie ticket booking platform built with the MERN stack**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Frontend-brightgreen?style=for-the-badge&logo=vercel)](https://quickshow-six-gilt.vercel.app/)
[![API](https://img.shields.io/badge/Live%20API-Backend-blue?style=for-the-badge&logo=vercel)](https://quickshow-server-navy-tau.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)

---

## 🌟 Overview

**QuickShow** is a modern, full-stack movie ticket booking web application that offers users a seamless experience to discover movies, select seats, and book tickets — all in one place. Administrators have access to a dedicated dashboard to manage movies, shows, and bookings efficiently.

🔗 **Frontend:** [https://quickshow-six-gilt.vercel.app/](https://quickshow-six-gilt.vercel.app/)  
🔗 **Backend API:** [https://quickshow-server-navy-tau.vercel.app/](https://quickshow-server-navy-tau.vercel.app/)

---

## ✨ Features

### 👤 User Features
- 🔐 Secure authentication (Sign up / Sign in)
- 🎥 Browse and search movies with rich details
- 🪑 Interactive seat selection interface
- 🎟️ Ticket booking and confirmation
- 📜 View booking history
- 📱 Fully responsive design for all screen sizes

### 🛠️ Admin Features
- 📊 Admin dashboard for centralized management
- 🎬 Add, edit, and delete movies
- 🗓️ Schedule and manage shows
- 📋 View and manage all bookings

---

## 🧰 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React.js | UI library |
| Vite | Build tool & dev server |
| Tailwind CSS | Styling |
| React Router | Client-side routing |
| Axios | HTTP requests |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime environment |
| Express.js | Web framework |
| MongoDB | Database |
| Mongoose | ODM for MongoDB |
| JWT | Authentication |
| Bcrypt | Password hashing |

### DevOps & Deployment
| Technology | Purpose |
|---|---|
| Vercel | Hosting (Frontend & Backend) |
| MongoDB Atlas | Cloud database |

---

## 📁 Project Structure

```
QuickShow/
├── client/                   # React Frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── assets/           # Static assets
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page-level components
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                   # Node.js + Express Backend
│   ├── config/               # Database & environment config
│   ├── controllers/          # Route logic
│   ├── middleware/            # Auth & validation middleware
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API route definitions
│   └── server.js             # Entry point
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/navadeep555/QuickShow.git
cd QuickShow
```

2. **Set up the Backend**

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory (see [Environment Variables](#-environment-variables)).

```bash
npm start
```

The server will start at `http://localhost:5000`

3. **Set up the Frontend**

```bash
cd ../client
npm install
npm run dev
```

The client will start at `http://localhost:5173`

---

## 🔐 Environment Variables

### Backend (`server/.env`)

```env
# Server
PORT=5000

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret_key

# Optional: TMDB API (for movie data)
TMDB_API_KEY=your_tmdb_api_key
```

### Frontend (`client/.env`)

```env
VITE_BASE_URL=http://localhost:5000
```

> ⚠️ **Never commit your `.env` files to version control.**

---

## 📡 API Endpoints

### Auth Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |

### Movie Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/movies` | Get all movies |
| GET | `/api/movies/:id` | Get movie by ID |
| POST | `/api/movies` | Add a movie (Admin) |
| PUT | `/api/movies/:id` | Update a movie (Admin) |
| DELETE | `/api/movies/:id` | Delete a movie (Admin) |

### Show Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shows` | Get all shows |
| GET | `/api/shows/:id` | Get show by ID |
| POST | `/api/shows` | Create a show (Admin) |

### Booking Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create a booking |
| GET | `/api/bookings/user` | Get user's bookings |
| GET | `/api/bookings` | Get all bookings (Admin) |

---

## ☁️ Deployment

Both the frontend and backend are deployed on **Vercel**.

| Service | URL |
|---------|-----|
| Frontend | [https://quickshow-six-gilt.vercel.app/](https://quickshow-six-gilt.vercel.app/) |
| Backend API | [https://quickshow-server-navy-tau.vercel.app/](https://quickshow-server-navy-tau.vercel.app/) |

### Deploy Your Own

**Backend:** Add a `vercel.json` in `server/` with the appropriate routing config and link your MongoDB Atlas URI in Vercel's environment variables.

**Frontend:** Set `VITE_BASE_URL` to your deployed backend URL in Vercel's environment variable settings.

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<div align="center">
