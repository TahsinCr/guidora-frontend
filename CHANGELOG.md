# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

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
- **Curated `@` Category Taxonomy**:
  - Formalized single-category structure with `@` prefix in `mockData.js` and `toolsService.js`.
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

