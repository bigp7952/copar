# Configuration Supabase

Ce guide explique comment configurer Supabase pour l'application COPAR.

## 📋 Étapes de configuration

### 1. Créer un projet Supabase

1. Va sur [supabase.com](https://supabase.com)
2. Crée un compte ou connecte-toi
3. Crée un nouveau projet
4. Note ton **URL du projet** et ta **clé API anonyme (anon key)**

### 2. Créer les tables dans Supabase

1. Va dans l'éditeur SQL de ton projet Supabase
2. Copie-colle le contenu du fichier `supabase-schema.sql`
3. Exécute le script SQL

Cela créera toutes les tables nécessaires :
- `clients`
- `payment_targets`
- `payment_parts`
- `expenses`
- `feedbacks`
- `users`
- `settings`

### 3. Configurer les variables d'environnement

1. Ouvre `src/environments/environment.ts`
2. Remplace les valeurs :
   ```typescript
   export const environment = {
     production: false,
     supabase: {
       url: 'https://ton-projet.supabase.co',
       anonKey: 'ta-cle-anon-key',
     },
   };
   ```

3. Fais de même pour `src/environments/environment.prod.ts` pour la production

### 4. Vérifier la connexion

1. Lance l'application : `npm start`
2. Ouvre la console du navigateur
3. Vérifie qu'il n'y a pas d'erreurs de connexion Supabase

## 🔒 Sécurité (Optionnel - Row Level Security)

Par défaut, les tables sont accessibles à tous. Pour activer la sécurité :

1. Dans Supabase, va dans **Authentication > Policies**
2. Active **Row Level Security** sur chaque table
3. Crée des politiques selon tes besoins

Exemple de politique pour que les utilisateurs ne voient que leurs propres données :
```sql
-- Exemple pour la table clients
CREATE POLICY "Users can view own clients" 
ON clients FOR SELECT 
USING (auth.uid()::text = user_id);
```

## 📊 Vérifier les données

1. Va dans **Table Editor** dans Supabase
2. Tu devrais voir toutes les tables créées
3. Les données seront synchronisées en temps réel avec l'application

## 🚀 Fonctionnalités activées

- ✅ Synchronisation en temps réel (Realtime)
- ✅ Calcul automatique du statut des paiements (triggers SQL)
- ✅ Mise à jour automatique de `updated_at`
- ✅ Relations entre tables (foreign keys)
- ✅ Index pour optimiser les performances

## ⚠️ Notes importantes

- Les données sont maintenant stockées dans Supabase, pas dans localStorage
- Les changements sont synchronisés en temps réel entre tous les clients
- Le statut des paiements est calculé automatiquement par le trigger SQL
- Assure-toi de sauvegarder régulièrement ta base de données Supabase

## 🔧 Dépannage

### Erreur de connexion
- Vérifie que l'URL et la clé API sont correctes
- Vérifie que le projet Supabase est actif
- Vérifie la console du navigateur pour les erreurs détaillées

### Tables non créées
- Vérifie que le script SQL a bien été exécuté
- Vérifie les logs SQL dans Supabase pour les erreurs

### Données non synchronisées
- Vérifie que les subscriptions Realtime sont actives
- Vérifie la console pour les erreurs de subscription

