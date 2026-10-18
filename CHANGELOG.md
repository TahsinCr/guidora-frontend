# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- **Multi-Category Live Catalog Sync & Adaptation (`toolsService.js`, `toolAdapter.js`)**:
  - Enhanced `loadBackendCatalog` to concurrently query category endpoints and build a comprehensive Many-to-Many junction map for all catalog products.
  - Updated `adaptProductDtoToTool` to resolve category slugs, names, and arrays with full UI contract fields (`icon`, `websiteUrl`, `categories`, `overviewText`, `keyFeatures`, `capabilities`, `similarTools`).
  - Hardened `getTools` and `getToolByIdSync` to search across both slugs and numeric identifiers without regression.

- **Governance & Verification API Endpoints (`adminApi.js`, `productsApi.js`)**:
  - Added `voteCommunityVerification` targeting `POST /api/products/{id}/verification/community-votes`.
  - Added user favorites API methods (`fetchMyFavorites`, `addFavorite`, `removeFavorite`) targeting `/api/favorites`.
  - Added verification moderation endpoints (`verifyProductAsAdmin`, `revokeAdminVerification`, `revokeCommunityVerification`, `fetchPendingCommunityReviews`, `approveCommunityReview`, `rejectCommunityReview`).

- **Unified Runtime Data Source Switcher (`modeService.js`)**:
  - Added dynamic runtime data source switching between live `.NET 10 WebAPI` endpoints and offline mock demo data.
  - Persists preference in `localStorage.getItem('guidora_datasource_mode')` and dispatches `guidora_mode_change` events across components.
  - Added one-click Mode Switcher button in `AdminHeader.jsx` (`MOD: CANLI BACKEND` vs `MOD: MOCK (DEMO)`) with instant toast alerts.
  - Resolved dynamic import warnings in `App.jsx` and `toolsService.js` by standardizing on static references, optimizing Rollup vendor chunking.

- **Direct Backend Admin API Gateway (`adminApi.js`)**:
  - Implemented REST client for live management endpoints: `/api/categories/management`, `/api/categories`, `/api/tag-categories`, `/api/tags`, `/api/product-edit-proposals/pending`, `/api/product-reports/open`, `/api/roles`, and `/api/audit/{id}/revert`.
  - Added async methods `adminFetchCategories`, `adminFetchTagCategories`, `adminFetchProposals`, `adminFetchReports`, and `adminFetchAll` in `adminService.js`.
  - Integrated optimistic caching in `adminService.js` that synchronizes mutations with the .NET 10 WebAPI when in backend mode while retaining synchronous fallback in mock mode.

### Fixed

- **Proposal Review Contract Alignment (`adminApi.js`)**:
  - Updated `acceptProposal` to pass a review note payload matching backend `ReviewNoteRequest` expectations.
- **Defensive Catalog & Verification Hydration (`toolsService.js`)**:
  - Hardened `loadBackendCatalog` against empty or non-array items responses and safe fallback on verification summary fetching in `getToolById`.

### Changed

- **Admin Dashboard Real-time Dual-Mode Data Integration**:
  - Updated `AdminDashboardPage.jsx` to fetch live data asynchronously when in backend mode, listening for `guidora_mode_change` events to refresh catalog, taxonomy, proposals, and reports immediately.
  - Restored full-featured `AdminDashboardPage` across all environments while eliminating mock-only limitations.
  - Maintained 100% vitest suite pass rate (83 passing tests across 14 suites).

## **[v1.0] - 02.10.2026**

### Changed

- **Admin Panel Enterprise UX & UI Overhaul (In-App Modals, Pagination, Filter Chips, Light Theme Contrast, Standalone Workspace)**:
  - Completely eliminated all native browser dialogs (`window.alert`, `window.confirm`, `window.prompt`) across the admin console.
  - Implemented accessible in-app confirmation modal (`AdminConfirmModal.jsx`) with keyboard `Escape` dismissal, multiple semantic color variants (`danger`, `warning`, `primary`, `info`), and asynchronous loading states.
  - Implemented community proposal review modal (`ProposalReviewModal.jsx`) featuring side-by-side delta diffs, fast rejection reason preset pills, character counters, and action loading states.
  - Added client-side pagination (10/25/50/All) with page size selector across all data tables (`ToolsTab`, `LogsTab`, `UsersTab`, `ReviewsTab`, `ProposalsTab`).
  - Added instant filter chips across all tabs for rapid slicing (tool approval/pricing status, log levels, proposal review states, review star ratings, user roles).
  - Added 1-click CSV and JSON export tools in data tabs (`ToolsTab`, `LogsTab`, `UsersTab`, `ReviewsTab`, `ProposalsTab`).
  - Fixed category tool counting bug where `t.category` stored display names while `cat.id` stored slugs.
  - Overhauled Light Mode contrast across the admin console, eliminating missing `--bg-main` fallback and ensuring high-contrast readable cards, tables, inputs, sidebars, modals, and badges.
  - Dedicated full-screen admin workspace: hid public directory Header, Footer, and ScrollToTop in `App.jsx` when `?view=admin` is active.
  - Upgraded table row selection checkboxes across all data tables with custom dark/light theme styled check boxes (`.rowSelectBtn`), glow effects, and smooth feedback.
  - Fixed multi-language support (TR, EN, RU) across the admin panel, with shortened language selector (`TR`, `EN`, `RU`) and brand logo home redirect.
  - Fixed async Promise handling in `getAllReviews()`, preventing component crashes in `ReviewsTab`.
  - Maintained 100% test suite pass rate (78 of 78 tests passing across 13 test suites) and verified Vite production build with gzip/brotli compression.

- **Standardized Container Build Specifications to Lowercase `dockerfile`**:
  - Renamed root build file `Dockerfile` to lowercase `dockerfile`.
  - Renamed mock backend server build file `infra/mock-server/Dockerfile` to lowercase `dockerfile`.
  - Aligned service build configurations in `docker-compose.yml` (`frontend.build.dockerfile: dockerfile` and `backend.build.dockerfile: dockerfile`).
  - Updated documentation references across `README.md` and `README-TR.md`.

### Added

- **Backend-Agnostic Admin Workspace & REST API Explorer (`SchemaTab.jsx`)**:
  - Decoupled the Admin Panel completely from specific backend and database implementations (PostgreSQL 18, EF Core migrations, VACUUM commands, and dead tuples), ensuring the frontend remains 100% compatible whether the backend is powered by .NET, Java (Spring Boot), Go, or Node.js.
  - Replaced the relational engine tab with `SchemaTab.jsx`, featuring three interactive views:
    1. **Alan Şemaları & Varlık Modeli (`entities`)**: Interactive explorer for 8 core domain models (`Product/ToolItem`, `Category`, `Tag`, `User`, `ProductEditProposal`, `Review`, `Report`, `AuditLog`) displaying field types, required flags, primary/foreign key badges, relationships diagram, and formatted JSON payload previews with one-click copy.
    2. **REST API Sözleşmeleri (`endpoints`)**: Searchable directory of 12 standard REST API contracts (`/api/products`, `/api/auth/*`, `/api/proposals/*`, `/health/live`) detailing HTTP methods (`GET`, `POST`, `PUT`, `DELETE`), authorization levels (`Public`, `Member`, `Admin`), query parameters, request schemas, status codes, and an interactive live test simulator.
    3. **Sistem Mimarisi (`architecture`)**: Architectural blueprint mapping the React SPA to RESTful contracts, stateless JWT authentication, and backend-agnostic data storage.
  - Modernized `AdminSidebar.jsx`: renamed tab to `Veri Modeli & API` with `Layers` icon and `8` entity badge, updated branding subtitle to `Yönetim Konsolu`, and reorganized navigation into 3 clean groups.
  - Updated `AdminHeader.jsx`: replaced vendor-specific `PG18: ONLINE` pill with generic `API: AKTİF (8ms)` status pill and updated breadcrumb titles.
  - Refactored `OverviewTab.jsx`: replaced database engine KPI and SLA cards with backend-agnostic entity architecture, REST API metrics, and connection capacity indicators.
  - Updated `tests/services/adminService.test.js` to comprehensively test entity schemas, field definitions, relationships, REST API endpoints, query explorer, proposals, and audit logs — achieving **74 passing tests** across 12 test suites.

- **Single Administrator Environment Variable & Backend-Agnostic Client Decoupling**:
  - Eliminated duplicate `VITE_MOCK_ADMIN_*` variables in `.env` and `.env.example`, consolidating strictly to a single `MOCK_ADMIN_*` definition (`MOCK_ADMIN_USERNAME`, `MOCK_ADMIN_EMAIL`, `MOCK_ADMIN_PASSWORD`).
  - Completely decoupled frontend bundle (`src/services/authService.js`, `src/services/userService.js`) from mock passwords or client-side authentication checks; purged passwords dictionary and plain-text storage from `localStorage`.
  - Upgraded authentication flow (`authService.js` and `AuthModal.jsx`) to be 100% backend-agnostic: the client sends credentials to `/api/auth/login` and receives the authenticated user session directly from the server response whether running against Vite's in-process mock engine, standalone Docker container, or real .NET 10 WebAPI.
  - Aligned server configurations (`infra/mock-server/mockHandler.js`, `vite.config.js`, `docker-compose.yml`) to seamlessly support both `MOCK_ADMIN_*` and .NET backend's `BOOTSTRAP_ADMIN_*`.

- **Enterprise Collapsible Admin Workspace & Management Architecture**:
  - Completely re-architected `AdminDashboardPage.jsx` into a modular, enterprise-grade admin workspace adhering to Guidora's cyber slate and dark glassmorphism design system.
  - Implemented classic collapsible left navigation sidebar (`AdminSidebar.jsx`) with smooth width transition (260px expanded $\leftrightarrow$ 76px compact), persistent localStorage state (`guidora_admin_sidebar_collapsed`), keyboard shortcut (`Ctrl+B` / `Cmd+B`), categorical sections, real-time badge counters, and off-canvas mobile drawer.
  - Created top workspace header (`AdminHeader.jsx`) equipped with active tab breadcrumbs, real-time live platform status pills (`API: AKTİF 8ms`, `Circuit: CLOSED`, `Cache: 99.4%`), quick global search, and platform JSON backup export/import controls.
  - Built interactive SVG traffic and latency analytics chart (`OverviewTab.jsx`) plotting 14-day requests and p95 latency curves with gradient fill, data nodes, and interactive hover tooltip, alongside category distribution bars and system SLA gauges.
  - Implemented multi-channel audit log hub (`LogsTab.jsx`) with level and category filters, free-text search across actor IP and OpenTelemetry trace IDs, and deep inspection modal (`JsonbDiffModal.jsx`) featuring side-by-side JSONB diff highlighting and automated audit rollback (`adminRevertAuditLog`).
  - Implemented governance review queue (`ProposalsTab.jsx`) for community `ProductEditProposals` featuring side-by-side field delta comparison and one-click catalog integration.
  - Implemented comprehensive moderation and administration tabs: `ToolsTab.jsx` with batch operations and inline `ToolStudioForm` editing, `CategoriesTab.jsx` with color swatches and `UnifiedTranslationModal`, `TagsTab.jsx` with taxonomy group hierarchy, `UsersTab.jsx` with role switching and initial password reveal, `OrganizationsTab.jsx`, `ReportsTab.jsx`, `ReviewsTab.jsx`, and `SystemTab.jsx` with maintenance mode scheduling and cache purging.

- **Unified In-Process Dev Mock Server & Bootstrap Admin Environment Integration**:
  - Implemented `infra/mock-server/mockHandler.js` providing an integrated, zero-dependency mock API handler shared seamlessly between Vite dev server middleware, standalone Node.js server, and Docker containers.
  - Eliminated `[vite] http proxy error ... ECONNREFUSED` during local development (`npm run dev`) by handling `/api/*` and `/health/*` endpoints in-process when `VITE_USE_MOCK=true` (the default).
  - Added graceful 502 Bad Gateway JSON error interceptor to Vite proxy when developing against real backend (`VITE_USE_MOCK=false`).
  - Added `"mock": "node infra/mock-server/server.mjs"` and `"dev:real": "VITE_USE_MOCK=false vite"` scripts to `package.json`.
  - Added test suite in `tests/infra/mockHandler.test.js` expanding total test coverage to 34 passing tests.
  - Integrated bootstrap administrator credentials driven by `.env` (`MOCK_ADMIN_USERNAME`, `MOCK_ADMIN_EMAIL`, `MOCK_ADMIN_PASSWORD`), matching backend `BOOTSTRAP_ADMIN_*` settings so developers and QA can authenticate with the exact same credentials in both mock and real backend.
  - Removed temporary demo buttons from UI: cleanly purged `10s Test: ON/OFF` button from `Header.jsx`, purged `handleFillDemoAdmin` and hardcoded demo credentials from `AuthModal.jsx`, and normalized input placeholders.

- **Automated Enterprise Test Suite (Vitest & Happy-DOM - 71 Passing Tests)**:
  - Configured high-performance `vitest` test suite in `tests/` directory with dedicated npm scripts (`npm test`, `npm run test:watch`) executing **71 critical integration and contract tests in ~550ms** across 12 specialized test suites.
  - Implemented `httpClient.test.js`: verifies in-memory access token injection, `credentials: 'include'` headers, transparent 401 token refresh with mutex queue concurrency locking, 429 rate-limiting parsing `Retry-After`, and .NET 10 validation exception mapping.
  - Implemented `circuitBreaker.test.js`: verifies failure threshold triggering (`CLOSED -> OPEN`), fast-fail zero-network protection, and `/health/live` probe recovery (`HALF_OPEN -> CLOSED`).
  - Implemented `networkTracker.test.js`: verifies in-flight request tracking, graceful draining (`waitForInFlight`), and browser online/offline events.
  - Implemented `tokenManager.test.js`: verifies runtime memory access token storage, prevention of XSS leaks into `localStorage`, and event-driven subscriber callbacks.
  - Implemented `toolAdapter.test.js`: verifies .NET 10 `ProductResponseDto` to frontend `ToolItem` contract conversion, null/partial field resilience, and `CreateProductRequest` generation.
  - Implemented `configService.test.js`: verifies runtime `config.json` loading, recursive deep-freeze immutability protection, and graceful fallback to `SAFE_CONFIG_DEFAULTS`.
  - Implemented `maintenanceHelper.test.js`: verifies emergency bypass keys (`?bypass=...`, sessionStorage, role authorization) and scheduled maintenance countdown calculation.
  - Implemented `authService.test.js`: verifies backend-agnostic authentication, server-driven session creation, custom event dispatching, and password validation.
  - Implemented `toolsService.test.js`: verifies catalog multi-filtering, search query matching, `highest-rated` sorting, slug resolution, and single-select tag category enforcement.
  - Implemented `adminService.test.js`: verifies PG18 database statistics, VACUUM execution, EF Core migrations history, read-only SQL query explorer safety, proposals review queue, and audit reversion.
  - Implemented `toastService.test.js`: verifies toast deduplication, automatic timer dismiss, and manual dismissal.
  - Implemented `mockHandler.test.js`: verifies in-process dev mock engine, health probes, JWT cookies, and 400/404 handling.
- **Enterprise Resilience, Ambient Status Line, Circuit Breaker & Graceful Maintenance Engine**:
  - Implemented `circuitBreaker.js` (CLOSED, OPEN, HALF-OPEN state machine) with automated fast-fail protection and lightweight `/health/live` probe recovery.
  - Built `AmbientStatusBar.jsx` ambient status line (2.5px) directly beneath the sticky navbar: amber/yellow for offline, vibrant red for backend outage, green for recovery, and purple-blue gradient shimmer for navigation.
  - Created zero-dependency `toastService.js` and `ToastContainer.jsx` with configurable 3-second auto-dismiss, deduplication, and glassmorphism styling.
  - Implemented `MaintenancePage.jsx` featuring Guidora's breathing compass emblem, custom operational description from `config.json` (no timer on maintenance screen per requirements), emergency bypass key authorization, and health check validation.
  - Built scheduled maintenance countdown with graceful in-flight request draining (`waitForInFlight`) and a pinned countdown card in `NotificationDrawer.jsx`.
  - Added 429 Too Many Requests rate-limiting interceptor with dynamic `Retry-After` header parsing.
- **Isolated Standalone Docker Compose & Demo Mock Backend**:
  - Decoupled `docker-compose.yml` to run the frontend repository in complete isolation without requiring the separate .NET backend repository on disk.
  - Implemented lightweight zero-dependency Node 22 Alpine mock API server container (`infra/mock-server/`) emulating core .NET 10 WebAPI contracts (`/health/live`, `/api/auth/*`, `/api/categories`, `/api/products`).
  - Configured Nginx internal proxy (`http://backend:8080/api/`) and host port mappings (`FRONTEND_PORT=80`, `MOCK_API_PORT=8080`) through `.env.example` and `.env`.
  - Mounts `public/config.json` directly from the host into `/usr/share/nginx/html/config.json:ro`, allowing on-the-fly runtime configuration changes without container rebuilds.
  - Ready for future zero-code monorepo reunification by simply replacing the mock backend service with the real .NET container.
- **Automatic Browser-Based Theme & Language Detection**:
  - Implemented automatic initial theme detection in `ThemeContext.jsx` using `window.matchMedia('(prefers-color-scheme: light)')`. If the user hasn't explicitly chosen a theme, it adapts to their OS/browser dark/light mode and listens to real-time system theme changes.
  - Implemented automatic initial language detection in `LanguageContext.jsx` parsing `navigator.languages` and `navigator.language` to seamlessly match Turkish (`tr`), Russian (`ru`), or English (`en`) without disrupting stored user overrides.
- **Production Multi-Stage Docker & Hardened Nginx Reverse Proxy Architecture**:
  - Implemented multi-stage Docker build pipeline (`node:22-alpine` builder $\rightarrow$ `nginx:1.27-alpine-slim` runner) with minimal footprint (<30 MB image size).
  - Hardened Nginx configuration (`infra/nginx/default.conf`) equipped with strict security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`, `Referrer-Policy: strict-origin-when-cross-origin`).
  - Added internal `/api/` reverse proxy forwarding to .NET 10 backend container, eliminating CORS entirely and shielding backend ports from the public internet.
  - Implemented dynamic cache management: immutable 1-year caching for fingerprinted assets (`/assets/`), 30-day caching for media, and `no-store` immediate invalidation for `index.html` and `config.json`.
  - Added native Docker healthcheck (`/healthz`) and unified `docker-compose.yml` linking frontend, backend, PostgreSQL 18, and Redis into an isolated bridge network.
- **Enterprise Dual Configuration Architecture (`.env` & `public/config.json`)**:
  - Implemented immutable build-time environment layer (`.env.example`, `.env`) for core infrastructure constants and build flags.
  - Implemented zero-rebuild runtime configuration (`public/config.json`) enabling on-the-fly tuning of network timeouts, rate limit thresholds, circuit breakers, and maintenance mode directly in Docker/Nginx without compiling code.
  - Created `configService.js` singleton with safe immutable defaults (`safeDefaults.js`), `deepFreeze` anti-tamper security, schema validation fallback, and reactive subscription hooks.
  - Equipped `httpClient.js` with dynamic `AbortController` timeout guards derived directly from the runtime configuration engine (8s default, 25s upload).
- **Enterprise .NET 10 WebAPI Integration & TanStack Query Infrastructure**:
  - Integrated `@tanstack/react-query` v5 with dedicated `query-vendor` rollup chunk, zero-friction caching (`staleTime: 5m`, `gcTime: 15m`), and optimistic UI readiness.
  - Implemented secure `src/services/api/httpClient.js` with `credentials: 'include'` for HttpOnly `guidora_refresh` cookie transmission and in-memory access token storage (zero disk leakage, complete XSS defense).
  - Built automatic 401 retry interceptor with concurrency mutex/queue, handling transparent session rotation without user interruption.
  - Added Vite `/api` development proxy in `vite.config.js` forwarding to .NET 10 backend (`localhost:8080`), pre-configured for Docker reverse proxy environments.
  - Created domain-agnostic `toolAdapter.js` to map `ProductResponseDto` cleanly to catalog view components without altering Figma layouts or UI states.
- **Automated Asset Optimization & Pre-Compression Engine (Brotli & Gzip)**:
  - Integrated `vite-plugin-compression` generating dual pre-compressed `.br` (Brotli) and `.gz` (Gzip) static assets on production build for cold-start server delivery (reducing vendor and app bundles by up to 75%).
  - Integrated `vite-plugin-image-optimizer` with `sharp` and `svgo`, achieving automated lossless SVG cleaning and lossy/lossless WebP/PNG/JPEG compression (~57% total image byte savings) during the build step.
- **Universal Lazy Loading & Background Chunk Optimization**:
  - Maintained `React.lazy()` code-splitting across all secondary views and dialogs (`ToolDialog`, `AuthModal`, `SubmitToolPage`, `UserProfilePage`, `AdminDashboardPage`, `NotificationDrawer`, `AccountSettingsModal`), keeping the main entry bundle at ~201 kB.
  - Wrapped modal openers (`handleOpenAuth`, `handleOpenNotifications`, `handleOpenSettings`) and route switches in React 18 `startTransition`, ensuring the active screen remains fully responsive while chunks download in the background.
  - Added hover prefetching in `ProductCard.jsx` (`onMouseEnter={() => import('@/components/tool-detail/ToolDialog')}`) and browser idle preloading (`requestIdleCallback`) in `App.jsx` for zero-latency interactions.
- **Enlarged Floating Compass & 5-Dot Fast Newton's Cradle PageLoader**:
  - Centered Guidora's enlarged compass icon (`58px` / `56px` SVG) with smooth vertical bobbing (`compassBob`) and an animated rotating needle (`needleSpin`).
  - Added a 5-dot purple Newton's cradle (`.newtonCradle`) directly beneath the compass, animating high-speed (~0.95s) elastic momentum transfer across left and right ends with shockwave propagation across the inner dots.
- **Floating "Scroll to Top" Button**:
  - Created `src/components/common/ScrollToTop.jsx` and `ScrollToTop.module.scss`.
  - Circular floating action button with glassmorphism, ArrowUp icon, and smooth scroll animation (`window.scrollTo({ top: 0, behavior: 'smooth' })`).
  - Automatically appears after 250px vertical scroll; fully responsive across mobile, tablet, and desktop viewports.
- **Admin User Creation Password Field**:
  - Added initial password input with interactive show/hide toggle in `AdminDashboardPage.jsx` Add User modal.
  - Connected with `userService.adminCreateUser` and `authService` credential storage (`guidora_user_passwords`), enabling instant sign-in for newly registered admin users.
- **Tabbed Tag & Tag Category Creation in Admin**:
  - Enhanced tag creation in `AdminDashboardPage.jsx` with a dual-tab modal: `Add Tag` (`Etiket Ekle`) and `Add Tag Group` (`Etiket Kategorisi Ekle`).
  - Added `adminAddTagCategory` and `adminDeleteTagCategory` in `adminService.js` to manage custom tag taxonomies and multi-language translations.
- **Interactive Community Reviews System**:
  - Implemented `src/components/tool-detail/ReviewsTab.jsx` under the `Reviews` tab.
  - Added visual score overview, 5-star distribution bars, and dynamic review counters.
  - Implemented interactive review submission form with 1-5 star picker, author metadata, and validation.
  - Added "Helpful" upvoting counters and localStorage persistence per tool.
- **Submit Tool Screen & GitHub Auto-Sync**:
  - Created `src/components/submit/SubmitToolModal.jsx` connected to the Header's "Submit Tool" button.
  - Implemented automated repository fetching via `toolsService.fetchGithubRepoData`: parses GitHub URLs to populate tool title, description, website, license, topics, README, and CHANGELOG.
  - Integrated a dual-tab Markdown Editor (`Write` / `Preview`) with quick formatting shortcuts (Bold, Italic, Heading, Code, List, Link).
  - Added configuration fields for automated bot hook synchronization (Webhook URL and sync frequencies) for future background crawler hooks.
  - Enabled immediate persistence in `localStorage`, adding newly submitted tools to the live directory feed.
- **Content Moderation & Issue Reporting**:
  - Created `src/components/tool-detail/ReportModal.jsx` accessible via "Report this tool" in the detail sidebar.
  - Added structured issue categories (broken link, outdated info, spam/malicious, copyright), details textarea, optional contact email, and submission confirmation.
- **Figma 2-Column Tool Detail Page**:
  - Implemented 2-column split architecture matching original Figma specifications.
  - Left column: Hero card (84px metallic icon), horizontal tabs bar, 4 status cards, and tool documentation.
  - Right column: Score/rank card, Visit Website CTA, creator card, and similar tools recommendations.
- **Hierarchical Tag Taxonomy & TagPicker**:
  - Implemented `src/components/submit/TagPicker.jsx`:
    - 2-3 lines scrollable input container for selected `#` tags with instant `×` removal.
    - Alphabetical (A-Z) index sections and Category grouping view.
    - Mutual exclusion (`only` rule) enforcement: displays inline conflict explanation banner directly beneath the tag input if user selects an incompatible single-choice tag.
- **Responsive Category Carousel**:
  - Created `src/components/home/CategorySlider.jsx` with `<` and `>` arrow navigation buttons for viewports `<= 850px`.
- **Markdown Rendering Engine**:
  - Integrated `marked` with GitHub-flavored markdown and soft breaks in `src/components/common/MarkdownRenderer.jsx`.
  - Added comprehensive styling for code blocks, tables, blockquotes, and lists in both dark and light modes.
  - Enabled Markdown rendering for tool documentation in the `About & Details` tab and the `Changelog` tab.
- **Authentic OAuth Logos & Auth Modal Refinements**:
  - Upgraded Google OAuth button with official 4-color Google "G" logo SVG (`#4285F4`, `#34A853`, `#FBBC05`, `#EA4335`) and theme-adaptive button surface.
  - Implemented crisp GitHub Octocat SVG logo and elegant separator divider (`OR / VEYA`).
  - Extended Guidora brand emblem logo across Welcome, Login, and Registration headers.

- **Clean View Transitions & Seamless Navigation**:
  - Removed all distracting navbar loading progress animations (`.navProgressBar` / `@keyframes navProgressGlow`) on tool view and page transitions, ensuring completely clean, silent, and seamless switching.
  - Removed artificial delays from `toolsService.js` when demo mode is off, providing 0ms data resolution.
- **Single Real Page Load PageLoader Policy**:
  - Restricted `PageLoader` strictly to the real initial page load / hard reload (`isInitialLoading`), ensuring it renders only once on entry.
  - Completely removed `PageLoader` from all dynamic sub-pages and dialogs (`ToolDialog.jsx`, `AuthModal.jsx`, `ToolStudioForm.jsx`), replacing them with instant transitions, button states, and seamless loading indicators.
  - Configured `<Suspense fallback={null}>` across main content and modal containers to eliminate intermediate loading flashes.
- **Full-Page Submit Tool Studio**:
  - Transformed the submit flow from a popup modal into a full-page SPA view (`?view=submit`) with client-side URL synchronization and zero page reload.
  - Added breadcrumb bar (`Directory > Submit AI Platform & Tool`) with return navigation.
  - Expanded `SubmitToolPage` to `100%` viewport container width with full-width split workspace.
- **Curated Category Taxonomy & Tag System**:
  - Removed `@` prefix from category names across the application (CategorySlider, InformationCard, SubmitToolPage dropdown, tool cards, mockData).
  - Preserved `#` prefix on tags across all views (TagPicker, ProductCard, ToolDetailView).
- **Responsive Inline Filter Accordion**:
  - Replaced full-screen drawer on viewport widths `<= 1080px` with an animated inline filter panel situated directly above the search bar.
  - Added smooth CSS grid/max-height accordion expansion and collapse transitions.
- **Equalized Category-to-Filter Mobile Spacing**:
  - Eliminated redundant 20px flex gap caused by closed 0-height `.inlineFilterWrapper` and adjusted `.main-content` flex gap (`gap: 0` on screens `<= 850px`).
  - Reduced the vertical gap between the Category Slider and the Search Bar from 44px down to 12px, making it completely uniform and identical to the Y-axis spacing between filter controls (12px - 13px).
- **Softer Progressive Category Scroll Transition**:
  - Replaced the hard binary threshold (`isScrolledPast` boolean switch) with continuous `requestAnimationFrame` scroll progress interpolation (`0px` to `150px`).
  - Hero and category slider now smoothly and proportionally fade (`1.0` down to `0.20`) and translate (`0px` to `-8px`) in direct sync with scroll distance, eliminating abrupt snaps.
  - Upgraded programmatic `scrollToCatalog` to standard 460ms ease-out cubic animation (`1 - (1 - progress)^3`), replacing the abrupt native browser scroll jump.
  - Tuned wheel gesture sensitivity to require an intentional scroll swipe (`deltaY > 35`) rather than accidental micro-twitches.
- **Compact Category Bar Below 850px**:
  - Re-architected category presentation on screens `<= 850px`.
  - Hides the large hero title, subtitle slogan, and scroll down button on mobile/tablet viewports, placing the category slider immediately beneath the navbar to eliminate wasted vertical space.
  - Re-enabled responsive left `<` and right `>` navigation arrow buttons on mobile/tablet, allowing intuitive one-tap horizontal category track navigation alongside fluid touch gestures.
- **Natural Scroll Layout Restoration**:
  - Reverted `FilterBar` sidebar to natural in-flow document positioning, eliminating nested internal scrollbars.
  - Reverted `ProductSorterBar` from fixed/sticky positioning to normal layout flow, eliminating viewport clipping and overlay friction.
  - Streamlined `InformationCard` hero container to eliminate layout height jump on scroll.
- **Theme Variable Tokens**:
  - Added `--accent-purple`, `--accent-purple-hover`, and `--accent-purple-glow` tokens to `:root` in `_theme.scss` for consistent vibrant violet CTAs across both dark and light themes.
- **Immediate Home Redirection on Logout**:
  - Configured global `guidora_auth_change` and `UserMenu.handleLogout` to reset active views (`view=admin`, `view=profile`, `view=submit`), dismiss dialogs, and route back to the home directory catalog (`/`).
- **Category Slider Edge-to-Edge Alignment**:
  - Removed horizontal padding offsets to align CategorySlider edge-to-edge with the search bar, filter panel, and card grid.
- **Header Actions & Responsive Sorter**:
  - Enabled the "Submit Tool" button across all view states with seamless SPA view switching.
  - SorterBar responsive flex-wrapping at 1080px with zero dropdown clipping.

### Removed

- **Navbar Search Button in Detail View**:
  - Removed the redundant search magnifier button from the Header toolbar when viewing tool details (`activeTool`), decluttering the navigation bar.
- **Top and Under-Navbar Loading Progress Bars**:
  - Removed the duplicate top-of-screen progress bar (`.navTransitionProgress` at `top: 0`) and the under-navbar animated progress bar (`.navProgressBar`), eliminating visual distraction on route and dialog transitions.
- **Static HTML Preloader in index.html**:
  - Completely removed the static purple emblem and text preloader from inside `#root` in `index.html`, eliminating the jarring flash on initial application boot.
- **PageLoader from Sub-pages & Modals**:
  - Removed full-screen and popup `PageLoader` from `ToolDialog.jsx`, `AuthModal.jsx`, and `ToolStudioForm.jsx` in favor of localized state transitions.
- **Explore Directory & Filters Button**:
  - Cleanly removed the standalone "Explore Directory & Filters" indicator button and its associated handlers and translations.
- **Outer Circular Spinner from PageLoader**:
  - Removed the rotating outer SVG gradient track circle and indicator ring around the compass emblem.
- **Purple Card Box & LOADING Badge from PageLoader**:
  - Removed the solid purple rounded square background and the pill `LOADING` badge from `PageLoader.jsx`, keeping only the floating compass emblem and Newton's cradle dots.

### Fixed

- **PageLoader Unstyled SVG Sizing Flash**:
  - Eliminated initial unstyled oversized SVG flash by assigning explicit SVG `width="56"` / `height="56"` attributes, strict CSS dimensional constraints (`!important`), and deferring visibility (`isReady` via `requestAnimationFrame`) until the browser finishes calculating layout and styles.
- **Permanent Footer Anchoring (Zero Center-Screen Collapse)**:
  - Applied flexbox sticky footer architecture in `src/styles/main.scss` (`.app-container { min-height: 100vh; display: flex; flex-direction: column; }` and `.main-content { flex: 1 0 auto; min-height: calc(100vh - var(--header-height, 72px)); }`).
  - Permanently anchors the footer to the bottom of the viewport across all page states, preventing the footer from collapsing to the screen center.
- **Permanent Multi-Purpose Clear / Close Button in Mobile Filters**:
  - Rendered the Clear button ("Temizle" / "Clear") permanently inside the mobile/inline filter header next to the "Filters" title.
  - Configured multi-purpose action: resets active filters if any are selected, or collapses/closes the filter panel if no selection has been made.
- **Mobile Dropdown Overflow & Input Viewport Fix**:
  - Resolved issue in `ProductSorterBar` where the `Top` time-filter dropdown menu overflowed 95px off the left edge of mobile screens due to a static `right: 0` positioning on a wrapped trigger.
  - Implemented dynamic trigger bounding client rect detection (`rect.left < 190`) with `.alignLeft` (`left: 0; right: auto;`) and `.alignRight` (`right: 0; left: auto;`), ensuring dropdowns always expand inwards and remain 100% within the mobile viewport.
  - Re-architected mobile `actionsRow` with `.actionControlsGroup` (`Filters` + `Grid/List` toggle on row 1) and `.actionDropdownsGroup` (`Relevance` + `Top` side-by-side 50/50 on row 2), eliminating awkward wrapping.
  - Added mobile `font-size: 16px` on `searchInput` and `filterSearchInput` to prevent unwanted iOS Safari auto-zoom which shifts the viewport out of bounds.
- **Admin Category Edit Modal Crash**:
  - Resolved `ReferenceError: catShowSlider is not defined` in `AdminDashboardPage.jsx` by connecting state to `catPopular`.
  - Category Edit modal now renders and saves modifications cleanly without crashing.
- **Fixed Navbar Offset Compensation & Smooth Scroll Animation**:
  - Implemented dynamic `--header-height` (`72px` desktop / `64px` mobile) and `--catalog-offset` (`calc(var(--header-height) + 16px)` / `12px`) CSS variables in `src/styles/base/_theme.scss`.
  - Added global `scroll-padding-top: var(--catalog-offset)` on `html` and `scroll-margin-top: var(--catalog-offset)` on `.contentLayout` (`#catalog-section`).
  - Added `scrollToCatalog(smooth)` dynamic scroll calculator in `src/components/home/InformationCard.jsx`, ensuring scrolling down brings the page to the exact catalog docking point right below the sticky navbar without clipping the "Filters" title, active badges, or search bar.
- **Tool Detail Scaling & Right-Side Blank Space**:
  - Fixed column wrap in `ToolDialog.module.scss` and `ToolSidebar.module.scss` at `<= 1024px`, ensuring both columns take 100% width with zero blank gap.
- **Tab Spacing Consistency**:
  - Removed rogue `margin-top: 20px` in `DocContent.module.scss` to ensure identical 20px spacing beneath `StatusCardGroup` across `About`, `Gallery`, `Changelog`, `Reviews`, and `Alternatives` tabs.
- **Reviews Tab Layout & Auth Readiness**:
  - Resolved flex/width collapse in `ReviewsTab.module.scss`, added full-width card layout, star rating hover effects, and simulated auth badge ("Posting as TahsinCr (Verified Member)").

### Security

- **XSS Sanitization Engine**:
  - Integrated `DOMPurify` sanitizer inside `src/components/common/MarkdownRenderer.jsx` to prevent Cross-Site Scripting (XSS) in Markdown release changelogs, descriptions, and user reviews.
- **External Link Sanitization & Tabnabbing Defense**:
  - Implemented centralized URL security helper (`sanitizeUrl` and `safeOpenExternal` in `src/utils/security.js`) blocking malicious protocol schemes (`javascript:`, `data:`, `vbscript:`, `file:`) and enforcing `noopener,noreferrer` tabnabbing defense across `ProductCard`, `ToolSidebar`, `ReportModal`, `UserProfilePage`, and `AdminDashboardPage`.
- **Client-Side Authorization Guard**:
  - Added route-level client-side authorization guard in `AdminDashboardPage.jsx` displaying a structured 403 Access Denied interface whenever unauthorized users attempt to access `?view=admin`.
- **Input Cleansing & Field Limits**:
  - Added input cleansing (`sanitizePlainText`) in `toolsService.addTool` to strip HTML markup and enforce clean metadata bounds before persistence.
- **Content Security Policy (CSP)**:
  - Configured Content Security Policy (CSP) meta header in `index.html` restricting script, style, font, image, and WebSocket origins with `frame-ancestors 'none'`.

### Documentation

- **Bilingual Documentation (README.md & README-TR.md)**:
  - Maintained comprehensive developer documentation in both English and Turkish with accurate architecture diagrams, responsive layout rules, performance metrics, and build instructions.
- **MIT License**:
  - Formally established the project license credited to TahsinCr.

### Testing

- **Temporary QA & Demo Delay Tooling**:
  - Created `10s Test: ON/OFF` toggle in the Header toolbar (`src/utils/demoDelay.js`, `Header.jsx`) to simulate async catalog latency for visual inspection of the branded `PageLoader`.
- **Admin Demo Credential Quick-Fill**:
  - Added single-click demo administrator credentials helper in `AuthModal.jsx` for rapid visual verification and permission testing.
- **1920x1080 & Multi-Device Automated Grid Verification**:
  - Validated responsive 4-column card grid rendering on 1920x1080 displays and verified responsive layout reflows down to 390px mobile viewports.
