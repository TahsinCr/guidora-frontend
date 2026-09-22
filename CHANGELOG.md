# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- **Fixed Navbar Offset Compensation & Smooth Scroll Animation**:
  - Implemented dynamic `--header-height` (`72px` desktop / `64px` mobile) and `--catalog-offset` (`calc(var(--header-height) + 16px)` / `12px`) CSS variables in `src/styles/base/_theme.scss`.
  - Added global `scroll-padding-top: var(--catalog-offset)` on `html` and `scroll-margin-top: var(--catalog-offset)` on `.contentLayout` (`#catalog-section`).
  - Added `scrollToCatalog(smooth)` dynamic scroll calculator in `src/components/home/InformationCard.jsx`, ensuring scrolling down brings the page to the exact catalog docking point right below the sticky navbar without clipping the "Filters" title, active badges, or search bar.
  - Implemented downward wheel & touch swipe gesture detection to smoothly animate from the hero to the catalog section.
  - Added category pill click auto-scroll to `#catalog-section`. Cleanly removed the standalone "Explore Directory & Filters" indicator button and its associated handlers and translations.
- **Floating "Scroll to Top" Button**:
  - Created `src/components/common/ScrollToTop.jsx` and `ScrollToTop.module.scss`.
  - Circular floating action button with glassmorphism, ArrowUp icon, and smooth scroll animation (`window.scrollTo({ top: 0, behavior: 'smooth' })`).
  - Automatically appears after 250px vertical scroll; fully responsive across mobile, tablet, and desktop viewports.
- **Admin User Creation Password Field**:
  - Added initial password input with interactive show/hide toggle in `AdminDashboardPage.jsx` Add User modal.
  - Connected with `userService.adminCreateUser` and `authService` credential storage (`guidora_user_passwords`), enabling instant sign-in for newly registered admin users.
- **Immediate Home Redirection on Logout**:
  - Configured global `guidora_auth_change` and `UserMenu.handleLogout` to reset active views (`view=admin`, `view=profile`, `view=submit`), dismiss dialogs, and route back to the home directory catalog (`/`).
- **Authentic OAuth Logos & Auth Modal Refinements**:
  - Upgraded Google OAuth button with official 4-color Google "G" logo SVG (`#4285F4`, `#34A853`, `#FBBC05`, `#EA4335`) and theme-adaptive button surface.
  - Implemented crisp GitHub Octocat SVG logo and elegant separator divider (`OR / VEYA`).
  - Extended Guidora brand emblem logo across Welcome, Login, and Registration headers.

### Changed & Fixed

- **Compact Category Bar Below 850px (Mobile & Tablet Mockup Match)**:
  - Re-architected category presentation on screens `<= 850px` to match mockup `media_1790038563890.png`.
  - Hides the large hero title, subtitle slogan, and scroll down button on mobile/tablet viewports, placing the category slider immediately beneath the navbar to eliminate wasted vertical space.
  - Re-enabled responsive left `<` and right `>` navigation arrow buttons on mobile/tablet, allowing intuitive one-tap horizontal category track navigation alongside fluid touch gestures.
  - Preserved all existing card, search, and filter structures as requested without regression.
- **Mobile Dropdown Overflow & Input Viewport Fix**:
  - Resolved issue in `ProductSorterBar` where the `Top` time-filter dropdown menu overflowed 95px off the left edge of mobile screens due to a static `right: 0` positioning on a wrapped trigger.
  - Implemented dynamic trigger bounding client rect detection (`rect.left < 190`) with `.alignLeft` (`left: 0; right: auto;`) and `.alignRight` (`right: 0; left: auto;`), ensuring dropdowns always expand inwards and remain 100% within the mobile viewport.
  - Re-architected mobile `actionsRow` with `.actionControlsGroup` (`Filters` + `Grid/List` toggle on row 1) and `.actionDropdownsGroup` (`Relevance` + `Top` side-by-side 50/50 on row 2), eliminating awkward wrapping.
  - Added mobile `font-size: 16px` on `searchInput` and `filterSearchInput` to prevent unwanted iOS Safari auto-zoom which shifts the viewport out of bounds.
- **Natural Scroll Layout Restoration**:
  - Reverted `FilterBar` sidebar to natural in-flow document positioning, eliminating nested internal scrollbars.
  - Reverted `ProductSorterBar` from fixed/sticky positioning to normal layout flow, eliminating viewport clipping and overlay friction.
  - Streamlined `InformationCard` hero container to eliminate layout height jump on scroll.
- **Admin Category Edit Modal Crash**:
  - Resolved `ReferenceError: catShowSlider is not defined` in `AdminDashboardPage.jsx` by connecting state to `catPopular`.
  - Category Edit modal now renders and saves modifications cleanly without crashing.
- **Tabbed Tag & Tag Category Creation in Admin**:
  - Enhanced tag creation in `AdminDashboardPage.jsx` with a dual-tab modal: `Add Tag` (`Etiket Ekle`) and `Add Tag Group` (`Etiket Kategorisi Ekle`).
  - Added `adminAddTagCategory` and `adminDeleteTagCategory` in `adminService.js` to manage custom tag taxonomies and multi-language translations.

- **Markdown Rendering Engine**:
  - Integrated `marked` with GitHub-flavored markdown and soft breaks in `src/components/common/MarkdownRenderer.jsx`.
  - Added comprehensive styling for code blocks, tables, blockquotes, and lists in both dark and light modes.
  - Enabled Markdown rendering for tool documentation in the `About & Details` tab and the `Changelog` tab.
- **Submit Tool Screen & GitHub Auto-Sync**:
  - Created `src/components/submit/SubmitToolModal.jsx` connected to the Header's "Submit Tool" button.
  - Implemented automated repository fetching via `toolsService.fetchGithubRepoData`: parses GitHub URLs to populate tool title, description, website, license, topics, README, and CHANGELOG.
  - Integrated a dual-tab Markdown Editor (`Write` / `Preview`) with quick formatting shortcuts (Bold, Italic, Heading, Code, List, Link).
  - Added configuration fields for automated bot hook synchronization (Webhook URL and sync frequencies) for future background crawler hooks.
  - Enabled immediate persistence in `localStorage`, adding newly submitted tools to the live directory feed.
- **Interactive Community Reviews System**:
  - Implemented `src/components/tool-detail/ReviewsTab.jsx` under the `Reviews` tab.
  - Added visual score overview, 5-star distribution bars, and dynamic review counters.
  - Implemented interactive review submission form with 1-5 star picker, author metadata, and validation.
  - Added "Helpful" upvoting counters and localStorage persistence per tool.
- **Content Moderation & Issue Reporting**:
  - Created `src/components/tool-detail/ReportModal.jsx` accessible via "Report this tool" in the detail sidebar.
  - Added structured issue categories (broken link, outdated info, spam/malicious, copyright), details textarea, optional contact email, and submission confirmation.
- **Figma 2-Column Tool Detail Page**:
  - Implemented 2-column split architecture matching original Figma specifications.
  - Left column: Hero card (84px metallic icon), horizontal tabs bar, 4 status cards, and tool documentation.
  - Right column: Score/rank card, Visit Website CTA, creator card, and similar tools recommendations.
- **Infinite Scroll & Responsive Grid**:
  - Continuous feed streaming via `IntersectionObserver` with advance 600px prefetch.
  - Auto-fill grid (`minmax(350px, 1fr)`) rendering exactly 4 wide cards per row on 1920x1080 displays.
- **Licensing**:
  - Added MIT License credited to TahsinCr.

### Changed

- **Full-Page Submit Tool Studio**:
  - Transformed the submit flow from a popup modal into a full-page SPA view (`?view=submit`) with client-side URL synchronization and zero page reload.
  - Added breadcrumb bar (`Directory > Submit AI Platform & Tool`) with return navigation.
- **Hierarchical Tag Taxonomy & TagPicker**:
  - Implemented `src/components/submit/TagPicker.jsx` matching user reference mockup:
    - 2-3 lines scrollable input container for selected `#` tags with instant `×` removal.
    - Alphabetical (A-Z) index sections and Category grouping view.
    - Mutual exclusion (`only` rule) enforcement: displays inline conflict explanation banner directly beneath the tag input if user selects an incompatible single-choice tag.
- **Curated Category Taxonomy & Tag System**:
  - Removed `@` prefix from category names across the application (CategorySlider, InformationCard, SubmitToolPage dropdown, tool cards, mockData).
  - Preserved `#` prefix on tags across all views (TagPicker, ProductCard, ToolDetailView).
- **Responsive Inline Filter Accordion**:
  - Replaced full-screen drawer on viewport widths <= 1080px with an animated inline filter panel situated directly above the search bar.
  - Added smooth CSS grid/max-height accordion expansion and collapse transitions.
- **Category Slider Edge-to-Edge Alignment**:
  - Removed horizontal padding offsets to align CategorySlider edge-to-edge with the search bar, filter panel, and card grid.
- **Full-Page Submit Tool Studio (100% Width)**:
  - Expanded `SubmitToolPage` to `100%` viewport container width with full-width split workspace.
- **Responsive Category Carousel**:
  - Created `src/components/home/CategorySlider.jsx` with `<` and `>` arrow navigation buttons matching user design mockup 1 for viewports `<= 850px`.
  - Configured left FilterBar to hide completely (`display: none`) at `<= 1080px`, expanding catalog grid to full width.
- **Report Modal Redesign**:
  - Redesigned `src/components/tool-detail/ReportModal.jsx` into modern interactive card selector with icons, glowing active states, target tool metadata preview, and character counter.

### Changed

- **Theme Variable Tokens**:
  - Added `--accent-purple`, `--accent-purple-hover`, and `--accent-purple-glow` tokens to `:root` in `_theme.scss` for consistent vibrant violet CTAs across both dark and light themes.
- **Header Actions**:
  - Enabled the "Submit Tool" button across all view states with seamless SPA view switching.
- **Compact Layouts & Responsive Sorter**:
  - SorterBar responsive flex-wrapping at 1080px with zero dropdown clipping.

### Fixed

- **Tool Detail Scaling & Right-Side Blank Space**:
  - Fixed column wrap in `ToolDialog.module.scss` and `ToolSidebar.module.scss` at `<= 1024px`, ensuring both columns take 100% width with zero blank gap.
- **Tab Spacing Consistency**:
  - Removed rogue `margin-top: 20px` in `DocContent.module.scss` to ensure identical 20px spacing beneath `StatusCardGroup` across `About`, `Gallery`, `Changelog`, `Reviews`, and `Alternatives` tabs.
- **Reviews Tab Layout & Auth Readiness**:
  - Resolved flex/width collapse in `ReviewsTab.module.scss`, added full-width card layout, star rating hover effects, and simulated auth badge ("Posting as TahsinCr (Verified Member)").

