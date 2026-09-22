# Sixth Ward Tool Library

`[Your name]`

A three-screen static site for a neighborhood tool lending library. Members browse the catalog, open a tool, and place a hold for pickup.

Built for Designing for Development, Build A. The design and the specification were provided. The build is mine.

---

## What is here

```
SPEC.md             The build specification. Build against this.
index.html          Screen 1: Catalog
tool.html           Screen 2: Tool detail
confirmation.html   Screen 3: Hold confirmation
src/input.css       Provided theme. Design tokens live here.
dist/styles.css     Compiled Tailwind. Generated, and committed so a host can serve it.
data/tools.json     Provided catalog data. Ten records, one of them retired.
images/             Category icons, one per category
```

The JavaScript does not exist yet. Filtering, rendering, and the hold flow are yours to direct.

## Running it locally

You need Node.js 20 or newer. Check with `node --version`.

Install once:

```
npm install
```

Then start working:

```
npm run dev
```

That runs two things together: Tailwind, which rebuilds `dist/styles.css` every time a file changes, and a local server. Open http://localhost:3000 in your browser. Leave the terminal running while you work. Press Ctrl+C in the terminal to stop it.

Open the site through that address rather than double-clicking `index.html`. The pages load `data/tools.json` with `fetch`, and browsers block that for files opened directly.

## Tools used

`[Name the AI coding tool you used and how you used it. This is the disclosure line, and it stays in the README for the rest of the term.]`
