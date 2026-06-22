# Forum PLUS — Bibliothèque des lives (site statique)

Site web public qui catalogue les **210 lives Forum PLUS**. Trois façons de trouver
un sujet : **recherche instantanée**, **navigation par thématique** (13 catégories),
et **sommaire chronologique complet** (du plus récent au plus ancien). Chaque live a
sa **fiche détaillée** (résumé, concepts clés, points abordés, liens entre lives).

100 % statique (HTML/CSS/JS). **Aucune dépendance, aucun build.** Fonctionne aussi
bien en double-cliquant le fichier en local qu'une fois déployé en ligne.

---

## Structure

```
site/
  index.html            ← page (coquille)
  assets/
    styles.css          ← thème (clair, épuré)
    app.js              ← logique : recherche, filtres, routeur, fiches
    data.js             ← DONNÉES générées (les 210 lives)  ← NE PAS éditer à la main
  README.md             ← ce fichier
../generate_site_data.py  ← génère data.js depuis les pages wiki Obsidian
```

`data.js` est produit automatiquement à partir des pages
`G:\Mon Drive\Obsidian Wiki\wiki\forum-plus\forum-plus-live-*.md`.
On n'édite jamais `data.js` directement : on met à jour la page wiki, puis on relance
le générateur.

---

## Voir le site en local

Double-cliquez `index.html` → il s'ouvre dans le navigateur. C'est tout.
(Tout est embarqué dans `data.js`, aucun serveur n'est nécessaire.)

---

## Mettre à jour après un nouveau live

1. Créer/finaliser la page wiki du live dans
   `G:\Mon Drive\Obsidian Wiki\wiki\forum-plus\` (même format que les autres :
   nom de fichier `forum-plus-live-<N>-<AAAA>-<MM>-<JJ>.md`, avec `## Sujet`,
   `## Résumé`, `## Points clés`, etc.).
2. (Optionnel mais recommandé) ajouter sa ligne dans `forum-plus-moc.md`.
3. Régénérer les données :

   ```powershell
   cd "G:\Mon Drive\Claude\Forum Plus"
   python generate_site_data.py
   ```

4. Recharger le site (ou le redéployer). Le nouveau live apparaît, catalogué et
   cherchable automatiquement.

Le générateur recalcule tout : titres, résumés, **catégories** (par mots-clés sur le
sujet du live), index de recherche, comptes par thématique et par année.

---

## Déployer en ligne (public)

Le dossier `site/` est un site statique : il se déploie tel quel partout.

**Vercel (glisser-déposer, gratuit)**
1. Aller sur https://vercel.com → *Add New… → Project*.
2. Glisser le dossier `site/` (ou le connecter à un dépôt Git).
3. Aucun réglage de build : *Framework Preset = Other*, *Output Directory = `.`*.
4. Déployer → une URL publique `…vercel.app` est créée.

**Netlify (alternative identique)**
- https://app.netlify.com/drop → glisser le dossier `site/`.

**Vercel CLI**
```powershell
cd "G:\Mon Drive\Claude\Forum Plus\site"
npx vercel        # suivre les invites ; redéployer ensuite avec : npx vercel --prod
```

À chaque mise à jour : relancer `generate_site_data.py`, puis redéployer (re-drag du
dossier, ou `npx vercel --prod`).

---

## Notes

- **Recherche** : sans accent et insensible à la casse (taper `etf`, `succession`,
  `or`, `crypto`, `pea`…). Filtre cumulable avec une thématique et une année.
- **Thématiques** : un live peut appartenir à plusieurs catégories. On peut en
  cumuler plusieurs (chips actifs en haut de la liste).
- **Lives « à enrichir »** : quelques lives (surtout mi-2024) n'ont pour l'instant
  qu'une transcription brute, pas encore de fiche structurée. Ils restent listés,
  datés et cherchables ; leur fiche affiche « Résumé détaillé à venir ». Dès qu'on
  structure leur page wiki et qu'on relance le générateur, la fiche se remplit.
- **Pas de lien vidéo** pour l'instant (choix MVP). Pour ajouter les replays plus
  tard : stocker l'URL par live (ex. champ `replay:` dans le frontmatter wiki) puis
  l'exposer dans `generate_site_data.py` et `app.js`.
```
