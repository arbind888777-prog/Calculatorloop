# Product Requirements Document (PRD) – Admin Panel & Smart Blog

**Project:** Financial Calculator Web App (Next.js)
**Author:** Kilo (AI Engineer)
**Date:** 2026‑04‑11

---
## 1. Vision & Goals
Create a secure, maintainable **admin interface** that enables privileged users to:
- Manage calculator modules (enable/disable, edit metadata, SEO tags).
- Control site‑wide settings (theme, language, banner messages).
- Publish and edit a **smart blog** (Markdown‑based) with optional AI‑generated summaries/tags.
- Keep the underlying user‑facing calculator experience fast, responsive, and SEO‑optimized.

---
## 2. Assumptions (Chosen defaults)
| Area | Decision (default) |
|------|-------------------|
| **Authentication** | NextAuth with **Credentials (email/password)** + **Google** provider. Session includes a `role` claim (`admin`). |
| **Authorization** | Role‑based: only `admin` can access `/admin/*` routes (both server‑side and client‑side). |
| **Data storage** | **File‑based JSON/YAML** under `data/admin/` for configuration (calculators, SEO, site settings). Blog posts stored as **Markdown** files in `content/blog/`. |
| **UI framework** | **Material‑UI (MUI) v5** for the admin dashboard (consistent components, theming). |
| **Blog source** | Static Markdown files (`content/blog/*.md`). 
| **AI assistance** | Optional OpenAI integration. Environment variable `NEXT_PUBLIC_OPENAI_API_KEY` (placeholder). |
| **Deployment URL** | Admin UI lives under the **same domain** at `/admin`. |
| **Roles** | Single `admin` role (future extension can add `editor`/`author`). |

If any of these defaults need to change, adjust the plan accordingly.

---
## 3. Functional Requirements
### 3.1 Authentication & Authorization
1. **Login page** (`/admin/login`) – email/password form + “Sign in with Google”.
2. **Session** – JWT stored in httpOnly cookie; `role` claim added on successful login.
3. **Protected routes** – Use Next.js `middleware.ts` to redirect non‑admin users to `/admin/login`.
4. **Logout** – Clears session cookie.

### 3.2 Admin Dashboard Layout
- Header with logo, logout button, and optional site‑wide banner message.
- Sidebar navigation (MUI `Drawer`):
  - Overview
  - Calculators
  - SEO Settings
  - Site Settings
  - Blog Manager
- Main content area renders the selected module.

### 3.3 Calculator Management
| Feature | Description |
|---------|-------------|
| List calculators | Table showing name, category, enabled flag, last‑updated date. |
| Toggle enable/disable | Quick switch; disabled calculators are hidden from the public site. |
| Edit metadata | Modal to edit title, description, SEO meta (title, description, OG tags). |
| Edit input schema | Advanced – JSON schema defining input fields (optional, future‑proof). |
| Save → writes to `data/admin/calculators.json`. |

### 3.4 SEO Management (Global & Per‑Calculator)
- Global SEO defaults (`data/admin/seoGlobals.json`).
- Per‑calculator overrides stored in the same `calculators.json` (nested `seo` object). |
- UI: Form with fields → updates JSON file.

### 3.5 Site‑wide Settings
- Theme (`light`/`dark`/`system`).
- Default language (EN, HI, etc.).
- Banner message (text + optional expiry date).
- Stored in `data/admin/siteSettings.json`.

### 3.6 Blog Manager
| Action | Details |
|--------|---------|
| List posts | Table: title, slug, published date, status (draft/published). |
| Create new post | Opens Markdown editor (MUI `TextField` multi‑line) with front‑matter fields: `title`, `slug`, `date`, `excerpt`, `tags`, `relatedCalculators` (multi‑select). |
| Edit existing post | Same editor, loads file from `content/blog/{slug}.md`. |
| Delete post | Confirmation modal → `fs.unlink`. |
| AI‑generated excerpt | “Generate summary” button calls `/api/admin/blog/ai-summary` (POST) passing markdown content; uses OpenAI **ChatCompletion** to produce a concise excerpt (under 160 chars). |
| Preview | Rendered Markdown preview (using `react-markdown`). |
| Publish toggle | `draft` → `published`; file rename to include date prefix if needed. |

### 3.7 API Layer (Next.js API Routes)
- **/api/admin/auth/** – handled by NextAuth (no custom code needed).
- **/api/admin/calculators** – `GET` (list), `PATCH` (update single calculator), `POST` (add new), `DELETE` (remove). Uses Node `fs/promises` to read/write `data/admin/calculators.json`.
- **/api/admin/seo** – `GET`/`PATCH` for global SEO defaults.
- **/api/admin/site** – `GET`/`PATCH` for site settings.
- **/api/admin/blog** – `GET` (list), `POST` (create), `PUT` (update), `DELETE` (remove). Operates on Markdown files in `content/blog/`.
- **/api/admin/blog/ai-summary** – `POST` – receives raw markdown, calls OpenAI, returns `excerpt`.

All routes validate that the caller’s session includes `role: admin`; otherwise return **401 Unauthorized**.

---
## 4. Non‑Functional Requirements
- **Security** – CSRF protection via NextAuth, httpOnly cookies, input sanitization, file‑path validation to prevent directory traversal.
- **Performance** – API routes read/write small JSON files; operations are O(1). Blog preview rendering done client‑side.
- **Scalability** – File‑based storage is fine for current app size; can be swapped to a DB later with minimal API changes.
- **Accessibility** – MUI components are WCAG‑compliant; add `aria-label`s where needed.
- **Responsiveness** – Admin UI collapses sidebar on mobile; forms are mobile‑friendly.
- **Testing** – 100% unit test coverage for API routes, integration tests for UI components, regression tests for existing calculator functionality.
- **Documentation** – Update `README.md` with admin usage guide, environment variable list, and deployment steps.

---
## 5. Data Model
### 5.1 `calculators.json`
```json
{
  "calculators": [
    {
      "id": "operatingMargin",
      "category": "business",
      "title": "Operating Margin Calculator",
      "description": "Calculate operating margin...",
      "enabled": true,
      "seo": {
        "title": "Operating Margin – Financial Calculator",
        "description": "Quickly compute operating margin...",
        "ogImage": "/images/operating-margin.png"
      },
      "inputSchema": {
        "type": "object",
        "properties": {
          "revenue": {"type":"number"},
          "operatingExpense": {"type":"number"}
        },
        "required": ["revenue","operatingExpense"]
      }
    }
    // …other calculators
  ]
}
```
### 5.2 `siteSettings.json`
```json
{
  "theme": "system",
  "language": "en",
  "banner": {
    "enabled": false,
    "message": "",
    "expires": null
  }
}
```
### 5.3 Blog Front‑Matter (YAML)
```yaml
---
title: "Understanding Operating Margin"
slug: "understanding-operating-margin"
date: 2026-04-10
excerpt: "A quick guide to operating margin and why it matters."
tags: ["business", "margin"]
relatedCalculators: ["operatingMargin"]
---
```
The rest of the file is the Markdown body.

---
## 6. UI Wireframes ( textual description )
1. **Login Page** – Centered card, email field, password field, Google sign‑in button.
2. **Dashboard** – MUI `AppBar` + `Drawer` (collapsed on mobile). Main area shows cards: *Calculators*, *Blog*, *Site Settings*.
3. **Calculators List** – MUI `DataGrid` with columns: Name, Category, Enabled (switch), Last Updated, Actions (Edit/Delete).
4. **Calculator Edit Modal** – Tabs: *General*, *SEO*, *Input Schema*. Save button writes to JSON.
5. **Blog Manager** – List view + “New Post” FAB. Editor page with two panes: Markdown source (left) and live preview (right). Bottom bar with “Generate AI Summary” button.
6. **Site Settings Page** – Simple form with Theme selector (radio), Language dropdown, Banner toggle + message field.

---
## 7. API Specification (OpenAPI style snippets)
```yaml
paths:
  /api/admin/calculators:
    get:
      summary: Get list of calculators
      security:
        - cookieAuth: []
      responses:
        '200':
          description: Array of calculator objects
    patch:
      summary: Update a calculator (partial)
      security:
        - cookieAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CalculatorPatch'
      responses:
        '200': { description: Updated object }
  /api/admin/blog:
    get:
      summary: List blog posts (metadata only)
    post:
      summary: Create new post
    put:
      summary: Update existing post
    delete:
      summary: Delete post
  /api/admin/blog/ai-summary:
    post:
      summary: Generate AI excerpt
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                content:
                  type: string
```
---
## 8. Technical Implementation Plan (Step‑by‑Step)
1. **Add NextAuth**
   - `npm i next-auth @next-auth/prisma-adapter` (prisma optional, will use JWT).
   - Create `[...nextauth].js` with Credentials + Google provider.
   - Add `role` claim in JWT callback (hard‑code admin for now, later read from a users JSON).
2. **Create middleware** (`middleware.ts`) to protect `/admin/*`.
3. **Data folder** – Add `data/admin/` with initial empty JSON files (`calculators.json`, `siteSettings.json`).
4. **API routes** – Implement CRUD for calculators, site settings, SEO, and blog (see spec).
5. **Install MUI** – `npm i @mui/material @emotion/react @emotion/styled`.
6. **Admin Layout** – `pages/admin/_app.tsx` with MUI theme provider, `components/admin/AdminLayout.tsx` (Drawer + AppBar).
7. **Login UI** – `pages/admin/login.tsx` using `next-auth/react` `signIn`.
8. **Calculator Management UI** – `components/admin/CalculatorManager.tsx` (DataGrid, Dialogs).
9. **SEO Settings UI** – `components/admin/SeoManager.tsx`.
10. **Site Settings UI** – `components/admin/SiteSettings.tsx`.
11. **Blog Manager** – `components/admin/BlogManager.tsx` and `components/admin/BlogEditor.tsx`.
12. **AI Summary Endpoint** – Use `openai` npm package (`npm i openai`) to call `chat/completions` with a prompt like “Summarize the following blog post in under 160 characters”.
13. **Environment variables** – Add placeholders to `.env.example` (`NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_OPENAI_API_KEY`).
14. **Testing** – Add Jest + React Testing Library. Write tests for each API route (mock `fs`). Write UI component tests for Admin pages (render, role protection).
15. **Update Existing Tests** – Run `npm test` to ensure current calculators still pass.
16. **Documentation** – Extend `README.md` with sections:
    - **Admin Setup** (env vars, creating first admin user).
    - **Blog Publishing Workflow**.
    - **AI Summary Configuration**.
17. **CI/CD** – Ensure pipeline runs `npm run lint && npm test && npm run build`.
18. **Deploy** – Vercel or similar; ensure `NEXTAUTH_URL` points to production domain.

---
## 9. Acceptance Criteria
- [ ] Admin can log in with email/password and Google.
- [ ] Non‑admin users are redirected to `/admin/login` when accessing `/admin/*`.
- [ ] Dashboard loads with navigation and shows overview cards.
- [ ] Calculator list displays all calculators; admin can toggle enabled flag, edit metadata, and save changes; changes persist in `calculators.json`.
- [ ] SEO fields update correctly and reflect on the public calculator pages.
- [ ] Site settings (theme, language, banner) persist and affect the front‑end.
- [ ] Blog manager can create, edit, delete markdown posts; generated files appear under `content/blog/`.
- [ ] AI summary button fills the `excerpt` front‑matter field (mocked if API key missing).
- [ ] All new API routes return **401** for unauthenticated/unauthorized requests.
- [ ] Existing calculator unit tests still pass (`npm test`).
- [ ] New unit/integration tests for admin features achieve ≥80% coverage.
- [ ] Linting passes (`npm run lint`).
- [ ] Build succeeds (`npm run build`).
- [ ] Documentation updated.

---
## 10. Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| File‑system race conditions when multiple admins edit simultaneously | Data loss or corrupted JSON | Serialize writes using `fs/promises` atomic `writeFile` + temporary file approach. |
| Storing admin credentials in plain JSON (if we add custom users) | Security breach | Initially rely on NextAuth providers (Google) or hashed passwords via bcrypt; avoid custom user store.
| OpenAI cost overruns | Unexpected expenses | Rate‑limit AI summary calls and fallback to manual excerpt if key missing.
| Large number of calculators → JSON becomes unwieldy | Performance degrade | Split per‑category JSON files if needed; keep API pagination for future.

---
## 11. Future Enhancements
- Replace file‑based storage with a proper relational DB (PostgreSQL) using Prisma.
- Add **role hierarchy** (`admin`, `editor`, `author`).
- Implement **media manager** for blog images (upload to Cloudinary or S3).
- Add **analytics dashboard** (page views via Plausible or Google Analytics API).
- Provide **i18n** for the admin UI (multiple admin languages).

---
## 12. Timeline (estimated effort)
| Phase | Days |
|-------|------|
| Auth & Middleware | 2 |
| Data layer (JSON API) | 2 |
| Admin Layout & Navigation | 1 |
| Calculator Management UI | 3 |
| SEO & Site Settings UI | 2 |
| Blog Manager UI + Markdown handling | 3 |
| AI Summary integration | 1 |
| Testing (unit + integration) | 3 |
| Docs & Cleanup | 1 |
| **Total** | **18 workdays** |

---
## 13. Next Steps
1. Commit the **PRD** file (`.kilo/plans/admin_prd.md`).
2. Begin implementation with **Step 1** (NextAuth & middleware).
3. Regularly update the todo list (`.kilo/plans/1775866678774-tidy-sailor.md`) as tasks move from *pending* → *in_progress* → *completed*.

---
*End of Document*