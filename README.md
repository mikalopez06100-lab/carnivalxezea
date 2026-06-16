# Carnival × Ezéa — Landing page

Funnel de vente single-file pour la collaboration **Carnival Sun Juice (JoeyStarr) × Ezéa** :
4 séries de sculptures en résine époxy, 25 pièces numérotées par série (100 au total).

> **Stop the Motion. Own the Moment.**

## Structure

```
index.html        → la page complète (HTML + CSS + JS inline, zéro dépendance)
assets/           → 17 images traitées (logos, sculptures, photos, tampon JoeyStarr)
_build/           → outils de build (non requis pour la prod)
  build.js        → pipeline de traitement d'images (détourage, keying logos)
  serve.js        → petit serveur statique local pour la preview
.claude/launch.json → config de preview
```

## Lancer en local

La page est autonome : ouvrir `index.html` directement dans un navigateur **suffit**.

Pour un vrai serveur local (chemins absolus propres) :

```bash
cd _build
npm install          # installe sharp (uniquement pour re-générer les images)
node serve.js        # sert le projet sur http://localhost:4321
```

## Gestion des pièces (réservations + admin)

- **Grille loto** : chaque série affiche 25 cases numérotées. Les pièces réservées
  sont cochées/hachurées. Le visiteur choisit son numéro → pré-rempli dans la modale.
- **Réservations placeholder** : au lancement, 5 à 7 pièces par série sont marquées
  réservées (objet `STATE_SEED` en haut du `<script>`) pour que le site ne soit pas vierge.
- **Admin** : lien discret `· admin ·` en bas à gauche, ou ajouter `#admin` à l'URL.
  Permet de mettre une série en/hors vente, réserver/libérer/vendre chaque pièce,
  randomiser, puis **Exporter** le bloc `STATE_SEED` à recoller dans `index.html`
  pour publier l'état à tous les visiteurs.
  - États d'une pièce : `fake` (placeholder) → `sold` (vente réelle) → libre.
  - Les modifs sont sauvegardées en `localStorage` (par navigateur) jusqu'à export.

## À finaliser

- [ ] Brancher le formulaire de réservation (`handleSubmit`, marqué `// TODO`) sur
      Formspree ou Netlify Forms.
- [ ] Ajouter la piste audio (`<audio id="audio-track" src="">`).
- [ ] (Optionnel) Backend temps réel (Supabase/Firebase) si les réservations doivent
      être partagées entre tous les visiteurs sans passer par l'export manuel.

## Régénérer les images

Les sources brutes ne sont pas versionnées. Le pipeline `_build/build.js` lit un dossier
source local et écrit dans `assets/` (détourage des sculptures, passage des logos en
blanc/transparent, recadrage des photos). Adapter la constante `SRC` si besoin.
