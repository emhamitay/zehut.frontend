# Zehut — Frontend

The web client for [Zehut](#) *(link to backend repo)* — a system for ingesting, matching, and de-duplicating contact records from messy spreadsheets and documents. This repository is the **React single-page app**: file upload and client-side parsing, a guided review flow for flagged duplicates, citizen search/edit/merge, and printable contact pages. The UI is right-to-left Hebrew.

---

## Screenshots

> *(Add 2–3 screenshots here using the synthetic/demo data — the upload summary, the merge-review screen, and a printable contact page show the product off best.)*

```
docs/
├── upload-summary.png
├── merge-review.png
└── contact-page.png
```

---

## Highlights

- **Client-side file parsing** — Excel files are parsed in the browser with SheetJS and Word documents with `mammoth`, then sent to the API for structured extraction. Keeps large/raw files off the wire.
- **Guided duplicate review** — after an upload, flagged conflicts are surfaced with the conflicting existing record side by side, and resolved inline via a merge-confirmation flow (with a mandatory reason saved to history).
- **Citizen management** — search by ID / phone / name, edit records with full change history, and a dedicated two-record merge screen.
- **Printable contact pages** — print-optimized layout (A4, sidebar collapsed) that flags suspected duplicate pairs and cross-page warnings directly on the sheet.
- **Token auth** — JWT stored client-side, attached via a `fetch` wrapper that clears the token automatically on `401`.

---

## Tech stack

**Framework:** React + Vite + TypeScript · **Routing:** React Router · **Styling:** Tailwind CSS v4 + shadcn/ui (Radix primitives) · **File parsing:** SheetJS (`xlsx`), `mammoth` · **State:** React Context (auth) · **Tests:** Vitest + React Testing Library

---

## Getting started

### Prerequisites
- [Bun](https://bun.sh) (or Node 18+)
- The [Zehut backend](#) running locally

### Run
```bash
bun install

# Point the client at the API
echo "VITE_API_BASE_URL=http://localhost:4000" > .env.local

bun run dev      # adjust to your package.json scripts
```

### Test
```bash
bun run test     # Vitest
```

---

## Project structure

```
src/
├── App.tsx              # Routes
├── auth/                # AuthContext + ProtectedRoute
├── components/          # Upload flow, merge confirmation, layout, UI primitives
├── pages/               # Login, Setup, AddCitizens, CitizensSearch,
│                        #   CitizenDetail, CitizensMerge, ContactSheets, Users
├── lib/                 # Typed API client + helpers
└── style/               # Tailwind + theme
```

---

## Data & privacy

This repository contains no personal data. All screenshots and demos use synthetic records, and the API base URL is supplied via environment variables.
