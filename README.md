# Boulangerie Lacapelle-Cabanac

Application Astro 6 pour Cloudflare Pages permettant de reserver des pains artisanaux chez Zacharie Zion, a Lacapelle-Cabanac.

## Fonctionnalites

- Reservation sans paiement en ligne.
- Calcul automatique du total selon le poids, le prix au kilo et les quantites.
- Fenetre de commande limitee au dimanche pour le retrait du lundi.
- Fenetre de commande limitee au mercredi pour le retrait du jeudi.
- Retrait uniquement entre 17 h et 18 h 30.
- Tableau de bord admin protege par mot de passe.
- Consultation des commandes par date de retrait.
- Reinitialisation d'une journee.
- Ajout, modification et suppression de produits.
- Catalogue modifiable sans changer le code.

## Demarrage local

Prerequis: Node.js 20 minimum.

1. Installer les dependances:

   ```bash
   npm install
   ```

2. Copier les secrets d'exemple:

   ```bash
   cp .dev.vars.example .dev.vars
   ```

3. Lancer le serveur:

   ```bash
   npm run dev
   ```

4. Simuler Cloudflare Pages apres build:

   ```bash
   npm run pages:preview
   ```

## Configuration Cloudflare

1. Creer une base D1:

   ```bash
   npx wrangler d1 create boulanger-lacapelle
   ```

2. Reporter l'identifiant renvoye dans `wrangler.jsonc` pour le binding `DB`, ou configurer le binding depuis le dashboard Cloudflare Pages.
3. Ajouter les secrets:

   ```bash
   npx wrangler secret put ADMIN_PASSWORD
   npx wrangler secret put ADMIN_SESSION_TOKEN
   ```

4. Build Cloudflare Pages:
   - Commande: `npm run build`
   - Repertoire de sortie: `dist`
   - Variable d'environnement recommandee sur Pages: `NODE_VERSION=20`

## Notes techniques

- Le schema D1 est initialise automatiquement au premier acces.
- Les produits par defaut sont ajoutes si la table est vide.
- Les commandes conservent un instantane du produit commande pour garder l'historique meme si le catalogue change.
