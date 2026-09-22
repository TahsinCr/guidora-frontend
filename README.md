[![React 18](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Sass](https://img.shields.io/badge/Sass-SCSS%20Modules-CC6699?style=flat-square&logo=sass&logoColor=white)](https://sass-lang.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

**English** | [Türkçe](README-TR.md)

# Guidora

Guidora is a frontend application for discovering, filtering, and comparing artificial intelligence platforms and developer tools. It translates Figma design layouts into modular React components using a custom SCSS auto-layout system, responsive edge-to-edge grid mechanics, and full dual-theme support.

The project is structured as a client-side single-page application. Tool querying and pagination are abstracted behind a service boundary (`toolsService.js`), making it straightforward to connect to a production backend API.

## Scope

The application provides:

- an adaptive card grid optimized for desktop density (4 cards per row on 1920x1080 displays);
- multi-criteria filtering across categories, verification levels, platforms, and pricing models;
- dynamic sorting (Relevance, Highest Rated, Most Popular, Newest) and text search;
- a two-column tool detail view matching Figma design specifications;
- native Markdown rendering (`marked`) for documentation and release changelogs;
- a "Submit Tool" screen with GitHub repository auto-fetching (stars, license, topics, README) and a dual-mode Markdown editor;
- an interactive community reviews system with rating breakdowns, star pickers, and helpful upvoting;
- a content moderation and issue reporting workflow;
- an infinite scroll feed powered by native `IntersectionObserver` with advance prefetching;
- a complete dual-theme engine (Dark and Light) built on semantic CSS custom properties;
- an energetic, sleek loading indicator (`PageLoader`) featuring an enlarged floating Guidora compass with an animated rotating needle and a fast 5-dot purple Newton's cradle momentum transfer effect;
- localized, non-intrusive popup dialog loaders for comprehensive modals (`AuthModal` and `ToolStudioForm`);
- URL query parameter synchronization (`?tool=<id>`) for bookmarkable views and browser history navigation;
- an SCSS layout module translating Figma Auto-Layout properties (`fill`, `hug`, `fixed`) to CSS.

The application deliberately does not include:

- a backend database or server-side API;
- automated web scraping or crawler pipelines;
- user authentication, payment processing, or submission management APIs.

A useful boundary is: client-side presentation, layout math, theme tokens, and interaction state belong here; persistence, authentication, and external scraping belong in upstream backend services.

## Architecture

```text
Presentation Layer (React 18 UI)
├── Layout Shell      Header, Footer, Dynamic Breadcrumbs
├── Catalog Views     Hero banner, category pills, sorter bar & product grid
├── Detail Overlays   Figma 2-column modal, tabs, status metrics & creator sidebar
└── Submission & QA   Submit Tool modal, GitHub auto-sync, Markdown editor & Report modal
             │
             ▼
Application State & Services
├── Theme Context     Dark / Light persistence via localStorage & CSS tokens
├── Services          toolsService abstraction (mock data, filtering, reviews & GitHub fetch)
└── URL Routing       History sync via search parameters (?tool=...)
             │
             ▼
Design & Layout Engine (SCSS)
├── Theme Tokens      Semantic CSS variables (_theme.scss, _reset.scss)
└── Auto-Layout       Figma layout primitives: fill, hug, fixed, flex, gap (_layout.scss)
```

Dependencies flow downward. UI components consume design tokens and layout mixins from the styling layer, and fetch tool records through the service interface. Components never reach across architectural boundaries or manage global state directly.

## Project Structure

- `src/components/`: Modular UI components organized by domain (`layout`, `home`, `tool-detail`, `submit`, and `common` markdown renderer).
- `src/services/`: Asynchronous service abstraction (`toolsService`) and curated datasets (`mockData`).
- `src/context/`: Global application state, including theme persistence (`ThemeContext`).
- `src/styles/`: Centralized SCSS system with semantic theme tokens (`base/`) and layout mixins (`modules/`).

## Layout Engineering

### Auto-Layout SCSS Engine

All component styles rely on `src/styles/modules/_layout.scss` instead of ad-hoc absolute positioning or scattered margins:

```scss
@use '@/styles/modules/layout' as layout;

// Sizing behaviors
@include layout.width(fill);     // width: 100%
@include layout.width(hug);      // width: fit-content
@include layout.width(340px);    // fixed width: 340px

// Standardized Flexbox
@include layout.flex(row, space-between, center, 16px);
@include layout.flex(column, flex-start, stretch, 20px);

// Box Metrics
@include layout.box($padding: 24px, $border: 1px solid var(--border-card), $radius: var(--radius-lg));
```

### Grid Sizing on 1920x1080 Viewports

The catalog grid uses `repeat(auto-fill, minmax(350px, 1fr))` with a `20px` gap:

- In a standard 1920x1080 browser window, with the 210px filter sidebar and outer padding subtracted, the available content width is approximately `1578px`.
- The grid formula calculates:
  $$\frac{1578\text{px} - (3 \times 20\text{px})}{4} = 379.5\text{px}$$
- This naturally yields **exactly 4 cards per row**, with cards expanding slightly (~380px) to maintain balanced white space.
- On smaller viewports (1440px or 1200px), the same rule automatically reflows to 3 or 2 columns without horizontal overflow.

### Infinite Scroll Mechanics

The feed loads tools incrementally via `IntersectionObserver`:

- A dedicated sentinel element sits at the end of the product list.
- An advance buffer (`rootMargin: '600px'`) triggers the next page request before the user scrolls all the way to the bottom.
- Initial load renders 16 items; subsequent batches append 12 items up to the end of the filtered dataset.

### Performance & Architecture Optimizations

To ensure rapid First Contentful Paint (FCP), smooth scrolling (60 FPS), and low network overhead, the architecture implements several performance layers:

1. **Universal Route & Modal Code Splitting (`React.lazy`)**:
   - All secondary full-page views (`AdminDashboardPage`, `SubmitToolPage`, `UserProfilePage`) and modal overlays (`ToolDialog`, `AuthModal`, `NotificationDrawer`, `AccountSettingsModal`) are code-split into independent on-demand chunks.
   - The initial bundle size is kept at an ultra-light **~201 kB**, minimizing initial download overhead.

2. **React 18 Concurrent Background Transitions & Seamless Navigation**:
   - Navigation between views and dialogs is wrapped in `useTransition` / `startTransition`.
   - The current view remains interactive on screen while the background chunk downloads.
   - Distracting navbar progress bar animations have been eliminated; transitions occur instantaneously, silently, and cleanly without UI clutter.
   - Once the new screen is fully ready, it mounts instantaneously, while the previous screen is cleanly unmounted for optimal garbage collection.

3. **Smart Prefetching & Zero-Latency Feel**:
   - Tool cards trigger background prefetching on hover (`ProductCard.jsx`, `onMouseEnter`), ensuring detail modals open in 0ms without waiting for chunk download on click.
   - Secondary modal chunks (`ToolDialog`, `AuthModal`) are proactively warmed up during browser idle time via `requestIdleCallback`.
   - Artificial network simulation delays in `toolsService.js` are reduced to 0ms when demo mode is off.

4. **Single Real Page Load Policy & Anti-Flash Engine**:
   - The branded `PageLoader` displays **exclusively during the initial hard page load** (`isInitialLoading`).
   - The jarring static inline HTML preloader has been completely excised from `index.html` (`#root` is clean).
   - Dynamic routes and modals do not display `PageLoader`, relying instead on non-blocking background transitions and localized button states.
   - `<Suspense fallback={null}>` ensures zero intermediate screen flashes.
   - Flexbox sticky footer architecture (`.main-content { flex: 1 0 auto; min-height: calc(100vh - var(--header-height)); }`) permanently anchors the footer to the bottom of the viewport.

5. **Debounced Search & Async Query Processing (`useDebounce`)**:
   - Text inputs in the search and sorter bars utilize a 250ms debounce buffer (`useDebounce.js`).
   - Prevents UI micro-stutters and redundant filter queries while users type continuously.

6. **DOM Containment & Virtualization (`content-visibility: auto`)**:
   - Product catalog cards (`.card`) declare `content-visibility: auto` paired with `contain-intrinsic-size: auto 240px`.
   - The browser skips layout, styling, and paint calculations for cards outside the viewport, maintaining consistent 60 FPS scrolling even with deep infinite feeds.

7. **Vendor Chunk Isolation**:
   - Heavy 3rd-party libraries (`react`, `react-dom`, `lucide-react`, `marked`, `dompurify`) are partitioned into dedicated vendor chunks in `vite.config.js`, maximizing long-term browser cache retention.

8. **Temporary QA Demo Delay Tool (`Header.jsx`, `demoDelay.js`)**:
   - A dedicated navbar toggle (`10s Test: ON/OFF`) allows testing and observing initial loaders by injecting an artificial 10-second sleep into async catalog fetching.

### Security Architecture & Hardening

To safeguard against client-side exploitation, user impersonation, and injection vectors:

1. **XSS Sanitization Engine (`DOMPurify`)**:
   - All user-supplied Markdown content (release notes, tool documentation, community reviews) parsed by `marked` passes through `sanitizeHtml()` powered by `DOMPurify` before entering `dangerouslySetInnerHTML`.
   - Script tags, iframes, inline event listeners (`onerror`, `onload`), and execution attributes are stripped automatically.

2. **External Link Sanitization & Tabnabbing Defense**:
   - Outbound tool website links, creator links, and report targets pass through `sanitizeUrl()`.
   - Malicious link protocols (`javascript:`, `data:`, `vbscript:`, `file:`) are blocked, permitting only validated `http:` and `https:` schemes.
   - Programmatic `window.open` calls invoke `safeOpenExternal()` with `noopener,noreferrer` and nullified `opener` contexts.

3. **Client-Side Authorization Guard (`AdminRouteGuard`)**:
   - Access to the command center (`?view=admin`) is guarded against unauthenticated and non-privileged roles.
   - Unauthorized attempts render a structured 403 Access Denied interface rather than exposing administrative UI state.

4. **Input Cleansing & Schema Sanitization**:
   - Tool submission forms and profile inputs utilize `sanitizePlainText()` to strip HTML markup and enforce clean metadata bounds before state persistence.

5. **Content Security Policy (CSP)**:
   - Configured via `<meta http-equiv="Content-Security-Policy">` in `index.html` with explicit origins for styles, fonts, images, and WebSocket connections (`frame-ancestors 'none'`).

### Dual-Theme Architecture

Themes are toggled via the `data-theme` attribute on the root `<html>` element:

- **Dark Mode**: Slate-to-navy background (`#070c18`, `#0d1527`), subtle borders (`rgba(255, 255, 255, 0.08)`), and violet accents (`#8a38f5`).
- **Light Mode**: Clean background (`#f8fafc`), elevated card surfaces (`#ffffff`), defined borders (`#e2e8f0`), and slate-900 typography (`#0f172a`), maintaining contrast ratios above 15:1.
- Selections persist automatically in `localStorage`.

## Getting Started

### Prerequisites

- Node.js 18.x or newer
- npm 9.x or newer

### Installation

```bash
# Clone the repository
git clone https://github.com/TahsinCr/guidora-frontend-webside-design.git
cd guidora-frontend-webside-design

# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```

The application will start locally at `http://127.0.0.1:5173/`.

### Production Build

```bash
npm run build
```

The compiled, production-ready static assets will be output to the `dist/` directory.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 **TahsinCr**. All rights reserved.
