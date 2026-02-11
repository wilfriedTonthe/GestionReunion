# 🌍 RegioConnect - Système de Gestion Régionale

RegioConnect est une solution web complète (MERN Stack) conçue pour digitaliser et automatiser la gestion des réunions, de la discipline et des finances d'une organisation régionale.

## 🚀 Fonctionnalités Principales

### 🔐 Gestion Multi-Interface
L'application propose 4 tableaux de bord distincts selon le rôle :
- **Président :** Planification, lancement des votes et supervision globale
- **Trésorier :** Suivi de la caisse, graphiques financiers et validation des paiements
- **Censeur :** Contrôle des présences et gestion manuelle/automatique des amendes
- **Membre :** Pointage GPS, historique personnel et vote

### 📍 Pointage GPS & Amendes Automatiques
- **Vérification de zone :** Pointage impossible si le membre n'est pas à moins de 100m du lieu
- **Détection de retard :** Amende générée automatiquement si le pointage dépasse l'heure fixée
- **Gestion des absences :** Génération automatique des amendes pour tous les absents dès la clôture de la réunion

### 🗳️ Vote Électronique
- Création de scrutins sécurisés avec résultats en temps réel
- Contrôle d'unicité du vote par membre

### ⏰ Rappels Automatiques
- Notifications programmées à **J-7** et le **Jour J** via Node-cron

---

## 🛠️ Stack Technique

- **Frontend :** React.js, Tailwind CSS, Lucide Icons, Recharts
- **Backend :** Node.js, Express.js
- **Base de données :** MongoDB (Mongoose)
- **Authentification :** JWT (JSON Web Tokens)
- **Automatisation :** Node-cron pour les rappels

---

## 📂 Structure du Projet

```
reunion/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Meeting.js
│   │   ├── Fine.js
│   │   └── Vote.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── meetings.js
│   │   ├── fines.js
│   │   ├── votes.js
│   │   └── attendance.js
│   ├── utils/
│   │   └── reminders.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Meetings.jsx
│   │   │   ├── MeetingDetail.jsx
│   │   │   ├── Fines.jsx
│   │   │   ├── Votes.jsx
│   │   │   ├── VoteDetail.jsx
│   │   │   └── Users.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

---

## 🚀 Installation

### Prérequis
- Node.js (v18+)
- MongoDB (local ou Atlas)
- npm ou yarn

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Modifier .env avec vos configurations
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## ⚙️ Configuration

Créez un fichier `.env` dans le dossier `backend/` :

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/regioconnect
JWT_SECRET=votre_cle_secrete_jwt
JWT_EXPIRE=7d
```

---

## 📡 API Endpoints

### Authentification
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/me` | Profil utilisateur |

### Réunions
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/meetings` | Liste des réunions |
| GET | `/api/meetings/upcoming` | Réunions à venir |
| POST | `/api/meetings` | Créer une réunion (Président) |
| PUT | `/api/meetings/:id/start` | Démarrer une réunion |
| PUT | `/api/meetings/:id/end` | Terminer une réunion |

### Pointage
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/attendance/:meetingId/checkin` | Pointer sa présence (GPS) |
| GET | `/api/attendance/:meetingId/status` | Statut de présence |

### Amendes
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/fines` | Liste des amendes |
| GET | `/api/fines/my` | Mes amendes |
| POST | `/api/fines` | Créer une amende |
| PUT | `/api/fines/:id/pay` | Valider un paiement |

### Votes
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/votes` | Liste des votes |
| POST | `/api/votes` | Créer un vote |
| PUT | `/api/votes/:id/open` | Ouvrir un vote |
| POST | `/api/votes/:id/cast` | Voter |
| GET | `/api/votes/:id/results` | Résultats |

---

## 👥 Rôles et Permissions

| Fonctionnalité | Président | Trésorier | Censeur | Membre |
|----------------|-----------|-----------|---------|--------|
| Créer réunion | ✅ | ❌ | ❌ | ❌ |
| Démarrer/Terminer réunion | ✅ | ❌ | ✅ | ❌ |
| Pointer présence | ✅ | ✅ | ✅ | ✅ |
| Créer amende | ✅ | ❌ | ✅ | ❌ |
| Valider paiement | ❌ | ✅ | ❌ | ❌ |
| Créer vote | ✅ | ❌ | ❌ | ❌ |
| Voter | ✅ | ✅ | ✅ | ✅ |
| Gérer membres | ✅ | ❌ | ❌ | ❌ |

---

## 🔒 Sécurité

- Authentification JWT avec expiration configurable
- Mots de passe hashés avec bcrypt
- Middleware de protection des routes
- Validation des rôles par endpoint

---

## 📱 Fonctionnalités GPS

Le système utilise l'API Geolocation du navigateur pour :
1. Obtenir les coordonnées GPS du membre
2. Calculer la distance avec le lieu de réunion (formule Haversine)
3. Autoriser le pointage uniquement si distance < 100m
4. Détecter automatiquement les retards

---

## 📄 Licence

MIT License - Libre d'utilisation et de modification.
