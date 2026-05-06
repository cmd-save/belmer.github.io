# belmer.github.io

Personal portfolio site, served by GitHub Pages from the `master` branch root.

Live at https://belmer.github.io.

## Stack

Vanilla HTML, CSS, and JavaScript. No build step.

```
index.html        single-page portfolio
css/styles.css    all styling
js/main.js        small interactions (reveal, smooth scroll, copy email)
images/           favicons, manifest, logo
.nojekyll         disables Jekyll processing on GitHub Pages
```

## Local preview

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

Commit to `master` and push. GitHub Pages picks it up automatically.

## Editing

The `index.html` file contains placeholders in `[square brackets]` — name,
title, bio, location, skills, experience entries, projects, email, social
links. Search and replace to personalize.
