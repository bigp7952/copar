# COPAR - Gestion de Clients et Paiements

Application web privée pour gérer les clients, leurs séances, les paiements (totaux et partiels), le suivi automatique des soldes, les dépenses personnelles et business, avec répartition automatique 40% Vivre / 40% Business / 20% Épargne.

## 🚀 Fonctionnalités

### Clients
- CRUD complet (Créer / Lire / Modifier / Supprimer)
- Informations : nom, type (pâtisserie, institut, resto…), email, téléphone, tarif par séance, notes
- Historique de toutes les séances et paiements
- Lien feedback unique pour chaque client

### Paiements
- **PaymentTarget** : paiement prévu ou séance prévue, montant total, statut (pending, partial, paid)
- **PaymentPart** : versements partiels reçus, date, note, répartition automatique (40/40/20)
- Solde restant calculé automatiquement
- Dashboard par client → liste des PaymentTargets + versements
- Alertes pour paiements incomplets

### Dépenses
- CRUD des dépenses personnelles et business
- Catégories personnalisables : nourriture, transport, matériel, etc.
- Suivi graphique par catégorie et par période

### Dashboard
- Totaux mensuels et annuels (revenus, dépenses, soldes)
- Graphiques :
  - Répartition Vivre / Business / Épargne
  - Paiements partiels vs reçus
  - Dépenses par catégorie
  - Évolution mensuelle / hebdomadaire
- Prévisionnel : revenus projetés si certains clients planifiés payent

### Feedback / Lien client
- Génération de lien unique et sécurisé pour chaque client → page publique
- Client peut :
  - Noter séance / client (1-5)
  - Ajouter commentaire
  - Voir solde restant
- Token unique avec expiration (optionnel)

### Export / Reporting
- Export CSV / Excel de paiements, versements partiels, dépenses
- Export PDF facture → inclut tous les versements partiels et solde restant
- Rapports par client, par mois, par catégorie

### Paramètres
- Ajuster ratios (40/40/20 par défaut)
- Ajouter / supprimer catégories de dépenses
- Définir devise (FCFA, Euro…)
- Gestion utilisateurs et rôles

## 🛠️ Technologies

- **Frontend** : Angular 19 + Tailwind CSS
- **State Management** : Angular Signals
- **Backend** : Supabase (PostgreSQL + Realtime)
- **Design** : Tailwind CSS avec design moderne et épuré

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Configurer Supabase (voir SUPABASE_SETUP.md)
# 1. Créer un projet Supabase
# 2. Exécuter le script SQL (supabase-schema.sql)
# 3. Configurer les variables d'environnement

# Lancer le serveur de développement
npm start

# Build de production
npm run build
```

L'application sera accessible sur `http://localhost:4200`

### Configuration Supabase

Voir le fichier [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) pour la configuration détaillée.

## 🎨 Design

- Design moderne et épuré avec Tailwind CSS
- Interface compacte et professionnelle
- Responsive (mobile, tablette, desktop)
- Couleurs sobres et professionnelles

## 📝 Structure du projet

```
src/
├── app/
│   ├── core/
│   │   ├── models.ts              # Modèles de données
│   │   └── app-data.service.ts    # Service de gestion des données
│   ├── layout/
│   │   └── shell/                 # Layout principal (sidebar + topbar)
│   └── pages/
│       ├── dashboard/             # Dashboard principal
│       ├── clients/               # Gestion des clients
│       ├── payments/               # Gestion des paiements
│       ├── expenses/               # Gestion des dépenses
│       ├── settings/               # Paramètres
│       └── feedback-public/        # Page publique de feedback
```

## 🔐 Sécurité

- Auth obligatoire (à implémenter)
- Permissions basiques → Admin full, Collaborateur limité
- Tokens de feedback uniques et expirables
- Validation backend pour toutes les entrées
- Backups réguliers

## 🚧 Roadmap

- [ ] Authentification complète
- [ ] Export CSV/PDF
- [ ] Notifications / rappels
- [ ] Multi-utilisateur pour agence
- [ ] Gestion des missions et planning
- [ ] Paiement en ligne (MoMo / Orange Money API)
- [ ] Mobile app wrapper (PWA)

## 📄 Licence

Projet privé - Tous droits réservés
