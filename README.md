# Boulangerie Lacapelle-Cabanac

Application Astro 6 pour Cloudflare Workers permettant de reserver des pains artisanaux chez Zacharie Zion, a Lacapelle-Cabanac.

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

Prerequis: Node.js 22.12 minimum.

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

4. Previsualiser le Worker apres build:

   ```bash
   npm run preview
   ```

## Configuration Cloudflare Workers

1. Creer une base D1:

   ```bash
   npx wrangler d1 create boulanger-lacapelle
   ```

2. Reporter l'identifiant renvoye dans `wrangler.jsonc` pour le binding `DB`.
3. Ajouter les secrets:

   ```bash
   npx wrangler secret put ADMIN_PASSWORD
   npx wrangler secret put ADMIN_SESSION_TOKEN
   ```

4. Se connecter a Cloudflare depuis la machine de deploiement:

   ```bash
   npx wrangler login
   ```

## Procedure de deploiement

### Deploiement manuel

1. Deployer le Worker:

   ```bash
   npm run deploy
   ```

Le Worker utilise la configuration definie dans `wrangler.jsonc`:

- entree Worker: `@astrojs/cloudflare/entrypoints/server`
- assets statiques: `./dist`
- binding D1: `DB`

### Previsualisation locale

Pour verifier le comportement Workers avant de deployer:

```bash
npm run preview
```

### CI/CD avec Workers Builds

Dans le dashboard Cloudflare, cree un projet `Workers Builds` et configure:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Version Node recommandee: `22`

Si tu utilises des environnements Wrangler plus tard, reconstruis l'application pour chaque environnement. Exemple:

```bash
CLOUDFLARE_ENV=production npm run deploy
```

## Depannage deploiement

- Si la home renvoie une erreur 500 sur Cloudflare, verifie d'abord que le binding D1 `DB` est bien configure sur le Worker deploye.
- Les secrets `ADMIN_PASSWORD` et `ADMIN_SESSION_TOKEN` n'affectent pas la home, mais ils sont requis pour l'administration.
- Utilise bien un projet Workers et non un projet Pages: avec Astro 6 et `@astrojs/cloudflare` v13, le chemin officiellement supporte est Cloudflare Workers.

## Notes techniques

- Le schema D1 est initialise automatiquement au premier acces.
- Les produits par defaut sont ajoutes si la table est vide.
- Les commandes conservent un instantane du produit commande pour garder l'historique meme si le catalogue change.
