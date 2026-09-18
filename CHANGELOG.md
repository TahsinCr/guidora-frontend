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

- **Theme Variable Tokens**:
  - Added `--accent-purple`, `--accent-purple-hover`, and `--accent-purple-glow` tokens to `:root` in `_theme.scss` for consistent vibrant violet CTAs across both dark and light themes.
- **Header Actions**:
  - Enabled the "Submit Tool" button across both catalog and tool detail navigation states.
- **Compact Layouts & Responsive Sorter**:
  - SorterBar responsive flex-wrapping at 1024px with zero dropdown clipping.
  - Compact 210px filter sidebar matching top card rows.

### Fixed

- **Light Mode Contrast & CTA Visibility**:
  - Fixed primary button and action visibility in Light Mode ensuring maximum WCAG AA contrast.
  - Resolved white-on-white text issues on search inputs, dropdown menus, and detail cards.
- **Dropdown Clipping**:
  - Eliminated horizontal scroll overflow clipping open dropdown menus on mobile viewports.
