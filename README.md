# Zehut — Frontend

The web client for Zehut (backend repo link TBD) — a system for ingesting, matching, and de-duplicating contact records from messy spreadsheets and documents. This repository is the **React single-page app**: file upload and client-side parsing, a guided review flow for flagged duplicates, citizen search/edit/merge, and printable contact pages. The UI is right-to-left Hebrew.

---

## Screenshots

> *(Add 2–3 screenshots here using the synthetic/demo data — the upload summary, the merge-review screen, and a printable contact page show the product off best.)*

```text
docs/
├── upload-summary.png
├── merge-review.png
└── contact-page.png
```

---

## Highlights

- **Client-first Excel parsing with AI fallback** — Excel files are parsed in the browser first (SheetJS heuristics for `fullname` / `id` / `phone`) and only fall back to server-side AI extraction when the shape is ambiguous or the result looks suspicious. Word documents (`.docx`) still use server-side extraction.
- **Guided duplicate review** — after an upload, flagged conflicts are surfaced with the conflicting existing record side by side, and resolved inline via a merge-confirmation flow (with a mandatory reason saved to history).
- **Citizen management** — search by ID / phone / name, edit records with full change history, and a dedicated two-record merge screen.
- **Printable contact pages** — print-optimized layout (A4, sidebar collapsed) that flags suspected duplicate pairs and cross-page warnings directly on the sheet.
- **Token auth** — JWT stored client-side, attached via a `fetch` wrapper that clears the token automatically on `401`.

---

## Excel extraction strategy (client-first, failure-safe)

When uploading Excel (`.xlsx` / `.xls`) from the upload flow:

1. The sheet is parsed locally first (no AI call yet).
2. The parser tries to detect columns for:
   - `fullname`
   - `id` (optional; missing values remain `null`)
   - `phone` (array; multiple phone columns are supported)
3. If headers are present, role detection uses Hebrew + English keywords and supports compound headers (for example: `מספר נייד`, `מס' טלפון`).
4. If headers are missing, content sniffing is used (numeric and text scoring per column).
5. Split name columns (`שם פרטי` + `שם משפחה`, or `first name` + `last name`) are joined into `fullname`.

### Phone normalization rules

- Removes spaces, dashes, dots, and parentheses.
- If a phone is 9 digits and starts with `5`, it is treated as a leading-zero loss and normalized to `05XXXXXXXX`.
- Valid mobile format is `05` + 8 digits.

### ID normalization rules

- 9 digits = valid ID.
- 8 digits are left-padded with `0`.
- Missing or invalid ID stays `null` (does not fail the row by itself).

### AI fallback triggers

Excel falls back to server-side AI extraction when any of these occur:

- Client parsing cannot confidently map columns.
- No usable contacts are produced.
- Parsed contacts contain zero phone values (post-parse safety guard).

This is intentionally conservative: prefer fast local parsing, but fail safely to AI when confidence is low.

### Testing

The parser behavior is covered by unit tests in `src/lib/__tests__/excel-parser.test.ts`, including:

- header and no-header sheets
- compound header variants
- split-name joining
- numeric-phone edge cases (leading zero stripped by Excel)
- fallback conditions and post-parse safety guard

---

## Tech stack

**Framework:** React + Vite + TypeScript · **Routing:** React Router · **Styling:** Tailwind CSS v4 + shadcn/ui (Radix primitives) · **File parsing:** SheetJS (`xlsx`), `mammoth` · **State:** React Context (auth) · **Tests:** Vitest + React Testing Library

---

## Getting started

### Prerequisites

- [Bun](https://bun.sh) (or Node 18+)
- The Zehut backend running locally

### Run

```bash
bun install

# Point the client at the API
echo "VITE_API_BASE_URL=http://localhost:4000" > .env.local

# Set to true when uploads may go through a remote AI service.
# The upload page will show a yellow privacy warning in that mode.
echo "VITE_AI_SENDS_DATA=false" >> .env.local

bun run dev      # adjust to your package.json scripts
```

### Test

```bash
bun run test     # Vitest
```

---

## Project structure

```text
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

If the upload flow is configured to send files through a remote AI service, the UI shows a privacy warning banner and real national ID numbers should not be uploaded.
