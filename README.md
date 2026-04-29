<div align="center">

# GS-MongoDB Handler

**A secure, responsive MongoDB management application — by Geeta Systems.**

A modern, browser-based MongoDB GUI built with **Next.js 16**, **React 19**, **TypeScript**, and **Tailwind v4**.

</div>

---

## Overview

GS-MongoDB Handler is a full-stack MongoDB client that lets you:

- Save and manage multiple MongoDB connection profiles.
- Browse databases and collections from a structured sidebar explorer.
- Query documents using JSON filter/sort/limit.
- Insert, edit, view, and delete documents from the UI.
- View and manage collection indexes.
- Use the app smoothly on desktop and mobile with dark/light themes.

The UI runs in the browser, while all MongoDB driver operations run on server-side API routes.

---

## Key Features

### Connection Management
- Save multiple named MongoDB URIs.
- URI values are encrypted in local storage using AES.
- Connection test endpoint with server info and latency.

### Explorer
- Database/collection tree view.
- Create and drop collections.
- Drop database with safety checks (system DBs are protected).

### Document Workspace
- Paginated document table.
- Type-aware rendering for ObjectId/Date/primitive values.
- Query bar (JSON filter, sort, limit).
- Insert/edit modal JSON editor.
- Read-only JSON viewer modal.

### Index Management
- List indexes for selected collection.
- Create indexes from JSON key spec.
- Drop non-system indexes.

### UX and Responsiveness
- Fully responsive layout with mobile drawer sidebar.
- Touch-friendly controls.
- Dark/light theme toggle.
- Toast feedback for operations.

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **UI:** React + Tailwind CSS v4
- **Language:** TypeScript
- **Database Driver:** `mongodb`
- **Encryption:** `crypto-js`
- **Icons:** `lucide-react`
- **Notifications:** `sonner`

---

## Project Structure

```text
src/
  app/
    api/
      connect/route.ts
      databases/route.ts
      databases/manage/route.ts
      collections/route.ts
      collections/manage/route.ts
      documents/route.ts
      indexes/route.ts
    globals.css
    layout.tsx
    page.tsx
  components/
    layout/
      AppShell.tsx
      Sidebar.tsx
      ThemeProvider.tsx
    ui/
      ConnectionManager.tsx
      QueryBar.tsx
      DocumentTable.tsx
      DocumentEditor.tsx
      DocumentViewer.tsx
      IndexViewer.tsx
  lib/
    mongodb.ts
    encryption.ts
    storage.ts
  types/
    index.ts
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended)
- A running MongoDB instance (local or Atlas)

### Install

```bash
pnpm install
```

### Environment

Create `.env.local` in project root:

```env
ENCRYPTION_SECRET=replace-with-a-strong-random-secret
```

> If not provided, the app falls back to a default dev secret. Set a real secret for production.

### Run Development Server

```bash
pnpm dev
```

Open: `http://localhost:3000`

### Build and Start Production

```bash
pnpm build
pnpm start
```

---

## Available Scripts

- `pnpm dev` — Run local development server.
- `pnpm build` — Build production bundle.
- `pnpm start` — Start production server.
- `pnpm lint` — Run ESLint.

---

## API Routes (Server)

All routes return:

```json
{ "success": true, "data": {} }
```

or

```json
{ "success": false, "error": "message" }
```

### Connections
- `POST /api/connect` — Test MongoDB URI.

### Databases
- `POST /api/databases` — List databases.
- `DELETE /api/databases/manage` — Drop a database.

### Collections
- `POST /api/collections` — List collections for a DB.
- `POST /api/collections/manage` — Create collection.
- `DELETE /api/collections/manage` — Drop collection.

### Documents
- `POST /api/documents` — Query/paginate documents.
- `PUT /api/documents` — Insert document.
- `PATCH /api/documents` — Update document by `_id`.
- `DELETE /api/documents` — Delete document by `_id`.

### Indexes
- `GET /api/indexes` — List indexes.
- `POST /api/indexes` — Create index.
- `DELETE /api/indexes` — Drop index.

---

## Security Notes

- MongoDB operations are server-side only via Next.js API routes.
- Saved URIs are encrypted before writing to `localStorage`.
- System DBs (`admin`, `local`, `config`) are protected from deletion.
- URI validation is enforced before connection attempts.

---

## Troubleshooting

### Connection Test Fails
- Verify URI format starts with `mongodb://` or `mongodb+srv://`.
- Check network/firewall/IP allowlist (Atlas).
- Confirm credentials and URL encoding.

### Saved Connection Cannot Be Decrypted
- This usually happens if `ENCRYPTION_SECRET` changed.
- Re-add the connection with the new secret.

### Build/Lint Issues
- Ensure dependencies are installed: `pnpm install`.
- Run `pnpm lint` and resolve any reported warnings/errors.

---

## Contributing

1. Create a feature branch.
2. Make focused changes.
3. Run lint/build locally.
4. Open a PR with clear description and screenshots for UI changes.

---

## License

Proprietary — Geeta Systems.

