# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- **Figma 2-Column Tool Detail Page**:
  - Implemented the complete 2-column split architecture matching the original Figma design specifications.
  - **Left Column (Main Overview)**:
    - Dedicated Hero Card with metallic gradient icon placeholder (84x84px), category badge, and trust indicators (*Admin Verified*, *Community Choice*, *Bot Verified*).
    - Horizontal Tabs navigation bar featuring `About & Details` (active indicator with glow), `Gallery`, `Changelog`, `Reviews` (counter badge), and `Alternatives`.
    - 4 Status summary cards displaying Pricing model, Platform support, Access state, and Last updated timeline.
    - Tool Overview card featuring rich contextual paragraphs, bold highlight keywords, and a bulleted Key Features section.
    - Classifications & Tags card with interactive Core Capabilities tag pills.
  - **Right Column (Sticky Actions & Intelligence)**:
    - Score & Actions card with rating, gold stars, neon rank badge (`RANK #4`), primary full-width purple Visit Website CTA button, and secondary Save/Compare actions.
    - Creator card with monogram avatar, verification checkmark badge, and company label.
    - Similar Tools recommendation widget with alternative product suggestions, category labels, and pricing tiers.
- **Top Header Breadcrumb Navigation**:
  - Added reactive breadcrumbs (`Directory > Category > Tool Name`) next to the Guidora logo when viewing tool details.
  - Clicking `Directory` returns cleanly to the catalog; clicking the category filters tools by that category.
- **Continuous Feed & Infinite Scroll**:
  - Implemented an asynchronous pagination mechanism using `IntersectionObserver` with a `600px` prefetch margin.
  - Removed manual "Load More" buttons in favor of continuous, smooth content streaming.
- **Expanded Dataset**:
  - Added 64 curated tools across 5 primary categories (*Generative Art*, *Coding Assistants*, *Image Generation*, *Chatbots*, *Video Generation*) with comprehensive metadata in `src/services/mockData.js`.
- **Figma Auto-Layout SCSS Module**:
  - Added `src/styles/modules/_layout.scss` providing standardized mixins for flexbox, grid, box models, and width behaviors (`fill`, `hug`, `fixed`).
- **Comprehensive Dual-Theme System**:
  - Added full light and dark mode support with semantic CSS custom properties in `src/styles/base/_theme.scss`.
  - Added instant theme switching in Header with `localStorage` persistence.
- **Licensing**:
  - Added MIT License credited to TahsinCr.

### Changed

- **Product Card Sizing & 4-Column Grid Density**:
  - Configured `ProductGrid` with `repeat(auto-fill, minmax(350px, 1fr))` and a `20px` gap.
  - On 1920x1080px desktop displays, renders exactly 4 wide, prominent cards (~380px each) per row across the 1578px container.
  - Enhanced `ProductCard` with `24px` internal padding, `56px` rounded thumbnails, and scaled typography for wide-card visual balance.
- **SorterBar & Search Responsiveness**:
  - Re-engineered SorterBar layout to be flex-wrap aware with a clean breakpoint at `1024px`.
  - Search box expands to 100% width on tablet/mobile views without squashing or breaking during screen resizing.
  - Dropdowns use elevated `z-index: 150` with popover animations, preventing any clipping from parent containers.
- **Compact FilterBar Footprint**:
  - Reduced filter sidebar width to `210px` and compressed vertical spacing (`14px` section gap, `8px` option gap, `2px` checkbox padding).
  - Reduced total vertical footprint from ~650px to ~450px, aligning neatly with the first two rows of catalog cards.
- **Semantic Color Tokens Across All SCSS Modules**:
  - Replaced all hardcoded `#ffffff` and `#111422` hex literals with CSS variables (`var(--text-primary)`, `var(--text-secondary)`, `var(--bg-card)`, `var(--bg-input)`).
  - Light theme now features deep slate typography (`#0f172a`), clean white card elevations (`#ffffff`), and subtle slate borders (`#e2e8f0`) with high contrast (> 15:1).

### Fixed

- **Light Mode Contrast & Readability**:
  - Fixed white-on-white text rendering in Light Mode across product cards, search inputs, dropdown menus, filter checkboxes, and detail cards.
- **Responsive SorterBar Breaking**:
  - Fixed search input squishing between 1025px and 1280px by enforcing flex basis and container wrapping.
- **Dropdown Clipping**:
  - Removed `overflow-x: auto` from the sorter actions row which previously clipped open dropdown menus on mobile viewports.
- **Dropdown Popover Translation Shift**:
  - Corrected dropdown opening keyframe animations to eliminate unwanted horizontal translation during entrance.

