# Clés Supabase - ⚠️ CONFIDENTIEL

**⚠️ NE PAS COMMITTER CE FICHIER DANS GIT**

## Clés Supabase

- **URL du projet** : `https://uxxyfsdggttjnnrjxmfd.supabase.co`
- **Anon Key (publique)** : Utilisée dans `environment.ts` et `environment.prod.ts`
- **Service Role Key (privée)** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4eHlmc2RnZ3R0am5ucmp4bWZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY3NzUxMSwiZXhwIjoyMDgwMjUzNTExfQ.D3wGybCqDFgDi9hjI557Te0J3ls_q7e8p0pjAIU5UIU`

## ⚠️ Sécurité

- La **Service Role Key** est une clé privée qui donne accès complet à la base de données
- **NE JAMAIS** l'utiliser côté client (dans le code Angular)
- **NE JAMAIS** la committer dans Git
- Utilise-la uniquement pour :
  - Scripts backend
  - Migrations
  - Opérations administratives

## Prochaines étapes

1. ✅ Les clés sont configurées dans `environment.ts`
2. ⏳ Exécuter le script SQL (`supabase-schema.sql`) dans Supabase
3. ⏳ Tester la connexion avec `npm start`

