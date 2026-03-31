# 🎯 Système de Fidélité — Full Stack Next.js 15

Application web progressive (PWA) de carte de fidélité numérique à tampons.

## Stack technique
- **Next.js 15** (App Router)
- **MySQL** + **Prisma**
- **NextAuth.js** (JWT)
- **Tailwind CSS**
- **TypeScript strict**
- **Nodemailer** (emails)
- **Recharts** (analytics)
- **html5-qrcode** (scan caméra)
- **qrcode.react** (génération QR)

---

## 🚀 Installation rapide

### 1. Prérequis
- Node.js 18+
- MySQL 8+

### 2. Cloner et installer
```bash
cd fidelite-app
npm install
```

### 3. Configurer l'environnement
```bash
cp .env.example .env
```
Éditez `.env` avec vos vraies valeurs :
```
DATABASE_URL="mysql://root:VOTRE_MOT_DE_PASSE@localhost:3306/fidelite_db"
NEXTAUTH_SECRET="une-chaine-aleatoire-de-32-caracteres"
NEXTAUTH_URL="http://localhost:3000"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="votre@gmail.com"
SMTP_PASS="votre-mot-de-passe-application-gmail"
SMTP_FROM="Fidélité <noreply@votre-app.com>"
```

### 4. Créer la base de données MySQL
```bash
mysql -u root -p -e "CREATE DATABASE fidelite_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 5. Migrer et générer le client Prisma
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 6. Seed (données de test)
```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

Comptes créés :
- **Admin** : `admin@fidelite.fr` / `admin123`
- **Client** : `client@fidelite.fr` / `client123`

### 7. Lancer
```bash
npm run dev
```
Ouvrez [http://localhost:3000](http://localhost:3000)

---

## 📱 Fonctionnalités

### Espace client (PWA mobile)
- **Carte de fidélité** visuelle avec grille de tampons animée
- **Scanner QR** depuis la caméra du téléphone
- **Historique** des tampons et récompenses
- **Profil** modifiable
- Navigation mobile avec barre fixe en bas
- Installable comme app (PWA)

### Espace admin
- **Dashboard** avec métriques et graphiques (Recharts)
- **Gestion clients** avec recherche et pagination
- **Configuration programme** (nom, tampons requis, récompense)
- **QR Codes** : génération, impression, historique
- **Récompenses** : liste et marquage comme utilisées

### Emails automatiques
- ✉️ Bienvenue après inscription
- ✉️ Confirmation de tampon reçu
- ✉️ Récompense débloquée

---

## 🗂️ Structure du projet

```
fidelite-app/
├── app/
│   ├── (auth)/login/         # Page connexion
│   ├── (auth)/register/      # Page inscription
│   ├── (client)/carte/       # Carte de fidélité (client)
│   ├── (client)/historique/  # Historique tampons
│   ├── (client)/profil/      # Profil utilisateur
│   ├── (admin)/dashboard/    # Dashboard admin
│   ├── (admin)/clients/      # Gestion clients
│   ├── (admin)/programme/    # Config programme
│   ├── (admin)/qrcodes/      # QR codes
│   ├── (admin)/recompenses/  # Récompenses
│   ├── scan/                 # Page de scan QR
│   └── api/                  # Routes API
├── components/
│   ├── admin/AdminSidebar.tsx
│   └── client/ClientNav.tsx, QrScanner.tsx
├── lib/
│   ├── auth.ts               # NextAuth config
│   ├── email.ts              # Nodemailer + templates
│   ├── prisma.ts             # Client Prisma singleton
│   └── qr.ts                # Génération tokens
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── middleware.ts             # Protection des routes
```

---

## 🔑 Routes API

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription |
| GET | `/api/cards/me` | Carte de l'utilisateur |
| GET | `/api/stamps/me` | Historique tampons |
| POST | `/api/stamps/redeem` | Scanner un QR et recevoir un tampon |
| POST | `/api/qr/generate` | Générer un QR (admin) |
| GET | `/api/qr/list` | Lister les QR (admin) |
| PATCH | `/api/users/me` | Mettre à jour le profil |
| GET | `/api/admin/stats` | Statistiques dashboard |
| GET | `/api/admin/clients` | Liste clients paginée |
| PATCH | `/api/admin/programs/[id]` | Modifier le programme |
| GET | `/api/admin/rewards` | Liste récompenses |
| PATCH | `/api/admin/rewards/[id]` | Marquer récompense utilisée |
| POST | `/api/email/test` | Test email (admin) |

---

## 🏭 Déploiement production

```bash
npm run build
npm start
```

Pensez à :
- Définir `NEXTAUTH_URL` avec votre domaine réel
- Utiliser un service SMTP fiable (Resend, Sendgrid, etc.)
- Configurer SSL sur MySQL en production
- Ajouter les vraies icônes PWA dans `/public/icons/`
