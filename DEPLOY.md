# Procedure de Deploiement — iacashflow.pro

## Architecture

- **Hebergement** : GitHub Pages
- **Branche source** : `main`
- **Domaine custom** : iacashflow.pro (via fichier CNAME)
- **CI/CD** : GitHub Actions (`.github/workflows/deploy.yml`)

---

## Deploiement automatique

Le site se deploie **automatiquement** a chaque push sur la branche `main`.

Le workflow GitHub Actions :
1. Checkout du code
2. Filtre les fichiers du site (HTML, CSS, JS, assets)
3. Upload l'artefact vers GitHub Pages
4. Deploie sur l'environnement `github-pages`

**Fichiers deployes** : `*.html`, `css/`, `js/`, `assets/`, `images/`, `fonts/`, `favicon.ico`, `robots.txt`, `sitemap.xml`, `CNAME`

**Fichiers exclus du trigger** : `agents/`, `lib/`, `shared/`, `orchestrator.py`, `config.yaml`, etc. (fichiers du systeme SWARM-CORP)

---

## Configuration GitHub (premiere fois)

### 1. Activer GitHub Pages

1. Aller dans **Settings** > **Pages**
2. Source : **GitHub Actions**
3. Sauvegarder

### 2. Configurer le domaine custom

1. Dans **Settings** > **Pages** > **Custom domain** : entrer `iacashflow.pro`
2. Cocher **Enforce HTTPS**
3. Creer un fichier `CNAME` a la racine du repo contenant :
   ```
   iacashflow.pro
   ```

### 3. Configuration DNS (chez le registrar)

Ajouter ces enregistrements DNS :

| Type  | Nom  | Valeur                     |
|-------|------|----------------------------|
| A     | @    | 185.199.108.153            |
| A     | @    | 185.199.109.153            |
| A     | @    | 185.199.110.153            |
| A     | @    | 185.199.111.153            |
| CNAME | www  | <username>.github.io       |

---

## Deploiement manuel

Pour declencher un deploiement manuellement :

1. Aller dans **Actions** > **Deploy to GitHub Pages**
2. Cliquer **Run workflow**
3. Selectionner la branche `main`
4. Cliquer **Run workflow**

Ou via CLI :
```bash
gh workflow run deploy.yml --ref main
```

---

## Verification post-deploiement

Apres chaque deploiement, verifier :

- [ ] Le site est accessible sur https://iacashflow.pro
- [ ] Toutes les pages se chargent (index.html, swarm-corp.html, portfolio.html)
- [ ] Les styles CSS sont appliques correctement
- [ ] Les scripts JS fonctionnent
- [ ] Les images/assets se chargent
- [ ] Le formulaire de contact est fonctionnel
- [ ] Le site est responsive (tester mobile)

---

## Depannage

### Le deploiement echoue
- Verifier l'onglet **Actions** pour les logs d'erreur
- S'assurer que GitHub Pages est configure en mode "GitHub Actions"
- Verifier que le fichier `index.html` existe a la racine

### Le domaine custom ne marche pas
- Verifier la configuration DNS (propagation : jusqu'a 48h)
- Verifier que le fichier `CNAME` est present et correct
- Verifier dans Settings > Pages que le domaine est valide (coche verte)

### Les assets ne se chargent pas
- Verifier que les chemins sont relatifs (pas de `/` en debut de chemin absolu)
- Verifier que les fichiers sont bien dans les dossiers copies par le workflow

---

*Derniere mise a jour : 2 Mars 2026 — Agent Riley (DevOps)*
