import React, { createContext, useContext, useState, useEffect } from 'react';

// Dictionary containing translations for English (en), Turkish (tr), and Russian (ru)
export const TRANSLATIONS = {
  en: {
    // Header & Brand
    'header.submitTool': 'Submit Tool',
    'header.signIn': 'Sign In',
    'header.searchPlaceholder': 'Search 12,000+ tools, prompts...',
    'header.switchToLight': 'Switch to Light Mode',
    'header.switchToDark': 'Switch to Dark Mode',
    'header.notifications': 'Notifications',
    'header.directory': 'Directory',
    'header.backToDirectory': 'Back to Directory',

    // Hero / InformationCard
    'hero.titlePart1': 'Discover the',
    'hero.titleHighlight': 'Perfect Tool',
    'hero.titlePart2': 'for Any Task',
    'hero.subtitle': 'The most advanced directory with deep filtering, real-time community verification, and bot-assisted updates.',
    'hero.allTools': 'All Tools',

    // Categories
    'cat.all': 'All Tools',
    'cat.generative-art': 'Generative Art',
    'cat.developer-tools': 'Coding Assistants',
    'cat.design-ui': 'Image Generation',
    'cat.llms-ai': 'Chatbots',
    'cat.video-motion': 'Video Generation',
    'cat.data-science': 'Data Science',
    'cat.audio-music': 'Audio & Music',
    'cat.productivity': 'Productivity',
    'cat.3d-motion': '3D & Motion',

    // FilterBar
    'filter.filters': 'Filters',
    'filter.searchFilters': 'Search categories, tags...',
    'filter.clear': 'Clear',
    'filter.clearFilters': 'Clear Filters',
    'filter.activeFilters': 'Active Filters',
    'filter.categories': 'Categories',
    'filter.verification': 'Verification',
    'filter.adminVerified': 'Admin Verified',
    'filter.communityChoice': 'Community Choice',
    'filter.botAudited': 'Bot Audited',
    'filter.organizations': 'Organizations',
    'filter.showMore': 'Show More',
    'filter.showLess': 'Show Less',
    'filter.selectOnlyOne': 'Select only one',
    'filter.selectMultiple': 'Multiple selection',

    // Tag Category Titles
    'tagCat.pricing': 'Pricing & Licensing',
    'tagCat.platform': 'Platform & Environment',
    'tagCat.capabilities': 'Capabilities & Architecture',
    'tagCat.deployment': 'Deployment & Hosting',
    'tagCat.license': 'Software License',

    // Tags
    'tag.free': 'Free',
    'tag.freemium': 'Freemium',
    'tag.paid': 'Paid / Enterprise',
    'tag.open-source': 'Open Source',
    'tag.free-trial': 'Free Trial',
    'tag.web': 'Web',
    'tag.macos': 'macOS',
    'tag.windows': 'Windows',
    'tag.linux': 'Linux',
    'tag.ios': 'iOS',
    'tag.android': 'Android',
    'tag.cli': 'CLI',
    'tag.api': 'API',
    'tag.extension': 'Extension',
    'tag.docker': 'Docker',
    'tag.wsl': 'WSL',
    'tag.cloud': 'Cloud SaaS',
    'tag.self-hosted': 'Self Hosted',
    'tag.offline-local': 'Offline Local',
    'tag.serverless': 'Serverless',
    'tag.edge': 'Edge Compute',

    // SorterBar
    'sorter.relevance': 'Relevance',
    'sorter.highestRated': 'Highest Rated',
    'sorter.mostViewed': 'Most Viewed',
    'sorter.newest': 'Newest First',
    'sorter.top': 'Top',
    'sorter.thisMonth': 'This Month',
    'sorter.thisWeek': 'This Week',
    'sorter.viewGrid': 'Grid View',
    'sorter.viewList': 'List View',
    'sorter.noToolsFound': 'No tools found matching your criteria',
    'sorter.tryAdjusting': 'Try adjusting your search terms or clearing active filters.',

    // User Menu & Profile
    'user.viewProfile': 'View Profile',
    'user.adminDashboard': 'Admin Dashboard',
    'user.orgsAndVer': 'Organizations & Verification',
    'user.accountSettings': 'Account Settings',
    'user.logOut': 'Log out',
    'user.editProfile': 'Edit Profile',
    'user.savedTools': 'Saved Tools',
    'user.submittedTools': 'Submitted Tools',

    // Notifications Drawer
    'notif.title': 'Notifications',
    'notif.newBadge': 'New',
    'notif.markAllRead': 'Mark all as read',
    'notif.clearAll': 'Clear',
    'notif.empty': 'All caught up! No unread notifications.',
    'notif.inspect': 'Inspect',

    // Footer
    'footer.apiAccess': 'API Access',
    'footer.privacy': 'Privacy',
    'footer.aboutUs': 'About Us',
    'footer.submitTool': 'Submit Tool',
    'footer.copyright': '© 2026 Guidora. The definitive AI tool directory. All rights reserved.',

    // User Profile & Reviews
    'user.reviews': 'My Reviews',
    'user.noReviews': 'No reviews posted yet',
    'user.noReviewsDesc': 'When you review tools in the directory, your ratings and evaluations will appear here.',
    'user.deleteReview': 'Delete Review',
    'user.confirmDeleteReview': 'Are you sure you want to delete this review?',
    'user.viewTool': 'View Tool',
    'user.shareProfile': 'Share Profile',
    'user.copiedLink': 'Copied link!',
    'user.joined': 'Joined',
    'user.reputation': 'Reputation',
    'user.platformAdmin': 'Platform Admin',
    'user.moderatorRole': 'Community Moderator',
    'user.toolCreator': 'Tool Creator',
    'user.communityMember': 'Community Member',

    // Reviews Tab in Tool Detail
    'reviews.title': 'Reviews & Ratings',
    'reviews.writeReview': 'Write a Review',
    'reviews.postReview': 'Post Review',
    'reviews.cancel': 'Cancel',
    'reviews.deleteConfirm': 'Delete this review?',
    'reviews.deleteReview': 'Delete Review',
    'reviews.helpful': 'Helpful',
    'reviews.noReviewsYet': 'No reviews yet. Be the first to share your experience!',

    // Admin Dashboard
    'admin.dashboard': 'Guidora Command Center',
    'admin.dashboardSubtitle': 'Comprehensive platform administration, review moderation, tag taxonomy, and user control.',
    'admin.tabOverview': 'Overview',
    'admin.tabTools': 'Tools',
    'admin.tabCategories': 'Categories',
    'admin.tabTags': 'Tags & Taxonomy',
    'admin.tabOrganizations': 'Organizations',
    'admin.tabUsers': 'Users & Roles',
    'admin.tabReviews': 'Review Moderation',
    'admin.tabReports': 'Reports',
    'admin.tabLogs': 'Audit Logs',
    'admin.tabSystem': 'System & Backup',

    'admin.statTotalTools': 'Total Tools',
    'admin.statVerifiedTools': 'Verified Tools',
    'admin.statCategories': 'Categories',
    'admin.statTags': 'Active Tags',
    'admin.statOrganizations': 'Organizations',
    'admin.statTotalUsers': 'Users',
    'admin.statTotalReviews': 'Total Reviews',
    'admin.statPendingReports': 'Pending Reports',
    'admin.statTraffic': 'Est. Traffic',

    'admin.moderatorBanner': 'Moderator Session Active: You have content & review moderation permissions. Role changes, database resets, and root taxonomy deletions require Administrator privileges.',
    'admin.lockedActionTooltip': 'Administrator permission required (Restricted for Moderators)',
    'admin.moderatorRestricted': 'Restricted for Moderators',

    'admin.reviewsTitle': 'Review Moderation Center',
    'admin.reviewsSubtitle': 'Inspect, verify, and remove inappropriate user ratings and reviews across all directory tools.',
    'admin.searchReviews': 'Search reviews by tool, author or content...',
    'admin.allRatings': 'All Ratings',
    'admin.reviewDeleted': 'Review successfully deleted',

    'admin.tagsTitle': 'Tag & Taxonomy Management',
    'admin.tagsSubtitle': 'Configure capabilities, platforms, pricing types, and license classifications for the directory filter system.',
    'admin.addTag': 'Add Tag',
    'admin.deleteTag': 'Delete Tag',
    'admin.tagCategory': 'Tag Group',
    'admin.tagName': 'Tag Name',
    'admin.tagSlug': 'Tag Slug',
    'admin.singleChoice': 'Single Choice Only',
    'admin.confirmDeleteTag': 'Delete this tag from the taxonomy?',

    'admin.usersTitle': 'User & Role Management',
    'admin.usersSubtitle': 'Manage user roles, reputation points, titles, and system access rights.',
    'admin.editUser': 'Edit User',
    'admin.saveUser': 'Save Changes',
    'admin.userRole': 'Role',
    'admin.userReputation': 'Reputation',
    'admin.userTitle': 'Professional Title',

    // Tool Detail, Status Cards & Tabs
    'tool.visitWebsite': 'Visit Website',
    'tool.save': 'Save',
    'tool.saved': 'Saved',
    'tool.compare': 'Compare',
    'tool.monthlyVisits': 'Monthly Visits',
    'tool.license': 'License',
    'tool.createdBy': 'CREATED BY',
    'tool.similarTools': 'SIMILAR TOOLS',
    'tool.reportListing': 'Report this tool listing',
    'tool.pricing': 'Pricing',
    'tool.platform': 'Platform',
    'tool.access': 'Access',
    'tool.updated': 'Updated',
    'tool.rank': 'RANK',
    'tool.basedOnReviews': 'Based on {count} reviews',
    'tool.verifiedBadge': 'Verified Member',
    'tabs.about': 'About & Details',
    'tabs.gallery': 'Gallery',
    'tabs.changelog': 'Changelog',
    'tabs.reviews': 'Reviews',
    'tabs.alternatives': 'Alternatives',
    'tabs.overview': 'Overview',
    'tabs.keyFeatures': 'Key Features',
    'tabs.capabilities': 'Core Capabilities',
    'tabs.docOverview': 'Documentation & Overview',
    'tabs.classificationsAndTags': 'Classifications & Tags',

    // Common
    'common.new': 'NEW',
    'common.loadingMore': 'Loading more tools...',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.back': 'Back',
    'common.submit': 'Submit',
    'common.success': 'Success',

    // Auth Modal
    'auth.welcomeTitle': 'Welcome to Guidora',
    'auth.welcomeSubtitle': 'Tools For Developers And Designers',
    'auth.continueGoogle': 'Continue with Google',
    'auth.continueGithub': 'Continue with Github',
    'auth.continueEmail': 'Continue with email',
    'auth.noAccountYet': "Don't have an account yet?",
    'auth.createAccount': 'Create Account',
    'auth.signInTitle': 'Sign In to Guidora',
    'auth.signInSubtitle': 'Enter your credentials to access your account',
    'auth.adminTest': 'Admin test:',
    'auth.quickFill': 'Quick Fill',
    'auth.usernameOrEmail': 'Username or Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.signingIn': 'Signing In...',
    'auth.signIn': 'Sign In',
    'auth.back': 'Back',
    'auth.needAccount': 'Need an account?',
    'auth.registerNow': 'Register now',
    'auth.createAccountTitle': 'Create Your Account',
    'auth.createAccountSubtitle': 'Join us today and get started with your journey',
    'auth.username': 'Username',
    'auth.emailAddress': 'Email Address',
    'auth.agreeTerms': 'I agree to the Terms and Conditions and Privacy Policy',
    'auth.subscribeNewsletter': 'Subscribe to our newsletter for updates and special offers',
    'auth.creatingAccount': 'Creating Account...',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.signInHere': 'Sign in here',
    'auth.loginFailed': 'Login failed. Please check your credentials.',
    'auth.passwordsDoNotMatch': 'Passwords do not match.',
    'auth.mustAgreeTerms': 'Please accept the Terms and Conditions and Privacy Policy.',
    'auth.registerFailed': 'Registration could not be completed.',

    // Settings Modal
    'settings.title': 'Account & Security Settings',
    'settings.changePassword': 'Change Password',
    'settings.changePasswordDesc': 'Use a strong and unique password to protect your account.',
    'settings.currentPassword': 'Current Password',
    'settings.newPassword': 'New Password',
    'settings.confirmNewPassword': 'Confirm New Password',
    'settings.updatePassword': 'Update Password',
    'settings.updating': 'Updating...',
    'settings.passwordUpdated': 'Your password has been updated successfully.',
    'settings.passwordsMismatch': 'New passwords do not match.',
    'settings.passwordMinLength': 'Password must be at least 6 characters.',
    'settings.notificationsTitle': 'Notification Preferences',
    'settings.emailNotifications': 'Email Notifications',
    'settings.emailNotificationsDesc': 'Receive email alerts about platform updates and reviews.',
    'settings.weeklyDigest': 'Weekly Digest',
    'settings.weeklyDigestDesc': 'Summary of top tools and trends sent once a week.',
    'settings.securityTitle': 'Advanced Security',
    'settings.twoFactor': 'Two-Factor Authentication (2FA)',
    'settings.twoFactorDesc': 'Add an extra layer of security to your account login.',

    // Report Modal
    'report.title': 'Report Tool Listing',
    'report.reason': 'Reason for Report',
    'report.details': 'Additional Details',
    'report.detailsPlaceholder': 'Describe the issue or provide evidence...',
    'report.yourEmail': 'Your Email (optional)',
    'report.submit': 'Submit Report',
    'report.submitting': 'Submitting...',
    'report.success': 'Thank you! Your report has been submitted to the moderation team.',
    'report.reasonBrokenLink': 'Broken Link / Service Down',
    'report.reasonBrokenLinkDesc': 'Website or API endpoint is dead or unreachable',
    'report.reasonOutdated': 'Outdated Information',
    'report.reasonOutdatedDesc': 'Pricing, feature set, or version specs are inaccurate',
    'report.reasonSpam': 'Spam or Malicious',
    'report.reasonSpamDesc': 'Suspected malware, deceptive copy, or unsafe service',
    'report.reasonCopyright': 'Copyright Infringement',
    'report.reasonCopyrightDesc': 'Unauthorized use of trademarks, intellectual property, or code',
    'report.reasonOther': 'Other Concern',
    'report.reasonOtherDesc': 'Duplicate listing or general policy issue',

    // Submit Tool
    'submit.title': 'Submit a New AI Tool',
    'submit.subtitle': 'Contribute to the directory with automated GitHub extraction and bot auditing.',
    'submit.importGithub': 'Automated GitHub Import',
    'submit.fetchRepo': 'Fetch Repo Data',
    'submit.fetching': 'Fetching...',
    'submit.toolName': 'Tool Name',
    'submit.tagline': 'Short Tagline',
    'submit.category': 'Primary Category',
    'submit.websiteUrl': 'Official Website URL',
    'submit.pricingType': 'Pricing Model',
    'submit.platforms': 'Supported Platforms',
    'submit.submitBtn': 'Submit Tool to Directory',

    // TagPicker
    'tagPicker.tagsAndCapabilities': 'Tags & Capabilities (Unlimited)',
    'tagPicker.selected': 'selected',
    'tagPicker.placeholder': 'No tags selected yet. Search and click tags below to add them to your tool (#Web, #Freemium, #LLM)...',
    'tagPicker.searchPlaceholder': 'Search tags by keyword (e.g. #Interface, #Web, #Free)...',
    'tagPicker.az': 'A-Z',
    'tagPicker.category': 'Category',
    'tagPicker.noTagsMatching': 'No tags matching',
    'tagPicker.noCatMatching': 'No categories matching',
    'tagPicker.onlyOneAllowed': '(Only 1 allowed)',
    'tagPicker.multipleAllowed': '(Multiple allowed)',
    'tagPicker.removeTag': 'Remove',

    // User Profile Editing & Info
    'user.editProfileTitle': 'Edit Profile',
    'user.fullName': 'Full Name',
    'user.fullNamePlaceholder': 'e.g. Tahsin Cr',
    'user.avatarInitials': 'Avatar Initials',
    'user.professionalTitle': 'Professional Title',
    'user.professionalTitlePlaceholder': 'e.g. Lead AI Engineer & Product Architect',
    'user.aboutBio': 'About / Bio',
    'user.aboutBioPlaceholder': "Share a short bio about what you're building or exploring...",
    'user.location': 'Location',
    'user.locationPlaceholder': 'e.g. Istanbul, Turkey',
    'user.websiteUrl': 'Website / GitHub URL',
    'user.saveChanges': 'Save Changes',
    'user.cancel': 'Cancel',
    'user.loadingProfile': 'Loading member profile...',
    'user.loadingTools': 'Loading tools...',
    'user.submittedEmptyDesc': 'Tools created or verified by this user will be listed here.',

    // Language Dropdown
    'lang.selectLanguage': 'Select Language',

    // Admin Additional
    'admin.welcomeTitle': 'Welcome to Guidora Command Center',
    'admin.welcomeSubtitle': 'Select an administration section above to inspect tools, adjust categories or manage verified organizations.',
    'admin.confirmBatchDelete': 'Delete all {count} selected tools?',
    'admin.confirmReset': 'DANGER: Are you sure you want to reset all admin configurations, custom tools, and categories back to factory defaults?',

    // Gallery Placeholders
    'tabs.galleryPreview1': 'Main Workspace Preview',
    'tabs.galleryPreview2': 'Canvas & Code Inspector',

    // User Menu Modal
    'userMenu.orgModalTitle': 'Organizations & Verification',
    'userMenu.orgPolicyNotice': 'Platform Verification Policy: Organizations cannot be registered via regular tool submission. They are strictly verified through Admin Approval or future Automated Bot Verification hooks to guarantee trust and credibility across Guidora.',
    'userMenu.addOrgAdminOnly': 'Add Verified Organization (Admin Only)',
    'userMenu.orgNamePlaceholder': 'Organization Name',
    'userMenu.orgWebsitePlaceholder': 'Website URL (https://...)',
    'userMenu.addOrgBtn': 'Create Verified Organization',

    // User Menu Items
    'userMenu.viewProfile': 'View Profile',
    'userMenu.adminDashboard': 'Admin Dashboard',
    'userMenu.organizations': 'Organizations & Verification',
    'userMenu.accountSettings': 'Account Settings',
    'userMenu.logOut': 'Log out',
    'userMenu.viewFullProfile': 'View full profile',
    'userMenu.admin': 'Admin',

    // Admin Quick Cards & Sections
    'admin.manageToolsCardTitle': 'Manage Directory Tools',
    'admin.manageToolsCardDesc': 'Toggle verification badges, audit community submissions, or remove outdated entries.',
    'admin.openToolsBtn': 'Open Tools →',
    'admin.configureCategoriesCardTitle': 'Configure Categories',
    'admin.configureCategoriesCardDesc': 'Create custom categories, set accent colors and toggle popular slider tags.',
    'admin.openCategoriesBtn': 'Open Categories →',
    'admin.verifiedOrgsCardTitle': 'Verified Organizations',
    'admin.verifiedOrgsCardDesc': 'Create organizations, manage enterprise affiliations and verification status.',
    'admin.openOrganizationsBtn': 'Open Organizations →',

    // Admin Tools Management
    'admin.liveToolsTitle': 'Live Directory Tools',
    'admin.liveToolsSubtitle': 'Toggle trust badges, inspect details, or remove tools from the live catalog.',
    'admin.searchToolOrCat': 'Search tool or category...',
    'admin.verifySelected': 'Verify',
    'admin.deleteSelected': 'Delete',
    'admin.colTool': 'Tool',
    'admin.colCategory': 'Category',
    'admin.colPricing': 'Pricing',
    'admin.colAdminVerified': 'Admin Verified',
    'admin.colCommunity': 'Community',
    'admin.colBotAudited': 'Bot Audited',
    'admin.colActions': 'Actions',

    // Admin Categories
    'admin.categoriesTitle': 'Directory Categories',
    'admin.categoriesSubtitle': 'Add, manage, and customize categories displayed in the hero carousel and filter drawers.',
    'admin.filterCategories': 'Filter categories...',
    'admin.addCategory': 'Add Category',
    'admin.colCategoryName': 'Category Name',
    'admin.colIdentifier': 'Identifier',
    'admin.colAccentColor': 'Accent Color',
    'admin.colSliderPopular': 'Slider / Popular',
    'admin.featured': 'Featured',
    'admin.standard': 'Standard',
    'admin.catNameEnLabel': 'Category Name (English / Default)*',
    'admin.catNameTrLabel': 'Turkish Translation (TR - Optional)',
    'admin.catNameRuLabel': 'Russian Translation (RU - Optional)',
    'admin.accentColor': 'Accent Color',
    'admin.showOnTopSlider': 'Show on Top Slider',
    'admin.createCategory': 'Create Category',

    // Admin Tags
    'admin.tagNameEnLabel': 'Tag Name (English / Default)*',
    'admin.tagNameTrLabel': 'Turkish Translation (TR - Optional)',
    'admin.tagNameRuLabel': 'Russian Translation (RU - Optional)',
    'admin.createTag': 'Create Tag',

    // Admin Organizations
    'admin.orgsTitle': 'Verified Organizations',
    'admin.orgsSubtitle': 'Organizations verified by Guidora Admins. Tools can be attributed to these verified owners.',
    'admin.filterOrgs': 'Filter organizations...',
    'admin.addOrganization': 'Add Organization',
    'admin.colOrganization': 'Organization',
    'admin.colWebsite': 'Website',
    'admin.colSource': 'Source',

    // Admin Reports
    'admin.reportsTitle': 'Community Reports & Flags',
    'admin.reportsSubtitle': 'Review submissions and reported issues flagged by community members.',
    'admin.reportsEmpty': 'No community reports pending. All clean!',
    'admin.colReportId': 'Report ID',
    'admin.colToolId': 'Tool ID',
    'admin.colReason': 'Reason',
    'admin.colDetails': 'Details',
    'admin.colStatus': 'Status',
    'admin.statusResolved': 'Resolved',
    'admin.statusDismissed': 'Dismissed',
    'admin.statusPending': 'Pending',

    // Admin System Maintenance
    'admin.systemTitle': 'System Maintenance & Data Management',
    'admin.systemSubtitle': 'Export directory data snapshots, restore backups, or reset local sandbox data.',
    'admin.backupExportTitle': 'JSON Backup Export',
    'admin.backupExportDesc': 'Download a full snapshot of your custom tools, newly created categories, verified organizations, and moderation logs.',
    'admin.exportBtn': 'Export Platform JSON',
    'admin.restoreTitle': 'Restore From Snapshot',
    'admin.restoreDesc': 'Upload a previously exported JSON backup file to instantly restore or populate the local directory state.',
    'admin.restoreBtn': 'Restore Backup File',
    'admin.resetTitle': 'Reset Platform Sandbox',
    'admin.resetDesc': 'Clear all administrative modifications and overrides, restoring factory mock datasets. Use with caution.',
    'admin.resetBtn': 'Reset to Defaults',

    'admin.editCategory': 'Edit Category',
    'admin.editTagCategory': 'Edit Tag Group',
    'admin.tagCategoryName': 'Tag Group Name',
    'admin.editTag': 'Edit Tag',
    'admin.manageTranslations': 'Manage Translations',
    'admin.translationModalTitle': 'Multi-Language Translation Manager',
    'admin.translationModalDesc': 'Manage localized translations relative to the default English name across all active languages.',
    'admin.defaultEnglishName': 'Default English Name',
    'admin.targetLanguages': 'Target Language Translations',
    'admin.fallbackNotice': 'Languages left blank will cleanly fallback to the default English name.',
    'admin.saveTranslations': 'Save Translations',
    'admin.editToolStudio': 'Tool Edit Studio',
    'admin.editToolStudioDesc': 'Full-featured editor to update metadata, taxonomies, pricing, badges, and documentation.',
    'admin.editUserStudio': 'User Account & Security Management',
    'admin.accountStatus': 'Account Status',
    'admin.statusActive': 'Active Account',
    'admin.statusSuspended': 'Suspended / Restricted',
    'admin.verifiedUserBadge': 'Verified User Badge',
    'admin.adminVerifiedBadge': 'Admin Verified Badge',
    'admin.communityChoiceBadge': 'Community Choice Badge',
    'admin.botAuditedBadge': 'Bot Audited Badge',
    'admin.markFeatured': 'Mark as Featured Tool',
    'admin.saveToolChanges': 'Save Tool Changes',

    // Auth Extras
    'auth.artBadge': 'Guidora Intelligence',
    'auth.artTitle': 'Unleash AI Innovation',
    'auth.artSubtitle': 'Curating high-precision models, developer workflows, and verified generative tooling.',
    'auth.usernamePlaceholder': 'e.g. admin@guidora.io or username',
    'auth.regUsernamePlaceholder': 'e.g. johndoe',
    'auth.regEmailPlaceholder': 'you@example.com',
  },

  tr: {
    // Header & Brand
    'header.submitTool': 'Araç Ekle',
    'header.signIn': 'Giriş Yap',
    'header.searchPlaceholder': '12.000+ AI aracı, komut ve model ara...',
    'header.switchToLight': 'Açık Temaya Geç',
    'header.switchToDark': 'Koyu Temaya Geç',
    'header.notifications': 'Bildirimler',
    'header.directory': 'Dizin',
    'header.backToDirectory': 'Dizine Geri Dön',

    // Hero / InformationCard
    'hero.titlePart1': 'Her Görev İçin',
    'hero.titleHighlight': 'Mükemmel Aracı',
    'hero.titlePart2': 'Keşfedin',
    'hero.subtitle': 'Derin filtreleme, gerçek zamanlı topluluk doğrulaması ve yapay zeka destekli güncellemeler içeren en gelişmiş dizin.',
    'hero.allTools': 'Tüm Araçlar',

    // Categories
    'cat.all': 'Tüm Araçlar',
    'cat.generative-art': 'Üretken Sanat',
    'cat.developer-tools': 'Kodlama Asistanları',
    'cat.design-ui': 'Görsel Üretimi',
    'cat.llms-ai': 'Sohbet Botları',
    'cat.video-motion': 'Video Üretimi',
    'cat.data-science': 'Veri Bilimi',
    'cat.audio-music': 'Ses ve Müzik',
    'cat.productivity': 'Verimlilik',
    'cat.3d-motion': '3D ve Animasyon',

    // FilterBar
    'filter.filters': 'Filtreler',
    'filter.searchFilters': 'Kategori ve etiket ara...',
    'filter.clear': 'Temizle',
    'filter.clearFilters': 'Filtreleri Temizle',
    'filter.activeFilters': 'Aktif Filtreler',
    'filter.categories': 'Kategoriler',
    'filter.verification': 'Doğrulama',
    'filter.adminVerified': 'Admin Doğrulamalı',
    'filter.communityChoice': 'Topluluk Seçimi',
    'filter.botAudited': 'Bot Denetimli',
    'filter.organizations': 'Kuruluşlar',
    'filter.showMore': 'Daha Fazla Göster',
    'filter.showLess': 'Daha Az Göster',
    'filter.selectOnlyOne': 'Yalnızca tek seçim',
    'filter.selectMultiple': 'Çoklu seçim',

    // Tag Category Titles
    'tagCat.pricing': 'Fiyatlandırma & Lisans',
    'tagCat.platform': 'Platform & Ortam',
    'tagCat.capabilities': 'Yetenekler & Mimari',
    'tagCat.deployment': 'Dağıtım & Barındırma',
    'tagCat.license': 'Yazılım Lisansı',

    // Tags
    'tag.free': 'Ücretsiz',
    'tag.freemium': 'Freemium',
    'tag.paid': 'Ücretli / Kurumsal',
    'tag.open-source': 'Açık Kaynak',
    'tag.free-trial': 'Ücretsiz Deneme',
    'tag.web': 'Web',
    'tag.macos': 'macOS',
    'tag.windows': 'Windows',
    'tag.linux': 'Linux',
    'tag.ios': 'iOS',
    'tag.android': 'Android',
    'tag.cli': 'CLI',
    'tag.api': 'API',
    'tag.extension': 'Eklenti',
    'tag.docker': 'Docker',
    'tag.wsl': 'WSL',
    'tag.cloud': 'Bulut SaaS',
    'tag.self-hosted': 'Kendi Sunucunda',
    'tag.offline-local': 'Çevrimdışı / Yerel',
    'tag.serverless': 'Sunucusuz',
    'tag.edge': 'Uç Bilişim',

    // SorterBar
    'sorter.relevance': 'Uygunluk',
    'sorter.highestRated': 'En Yüksek Puan',
    'sorter.mostViewed': 'En Çok Görüntülenen',
    'sorter.newest': 'En Yeniler',
    'sorter.top': 'En İyiler',
    'sorter.thisMonth': 'Bu Ay',
    'sorter.thisWeek': 'Bu Hafta',
    'sorter.viewGrid': 'Kart Görünümü',
    'sorter.viewList': 'Liste Görünümü',
    'sorter.noToolsFound': 'Kriterlere uygun araç bulunamadı',
    'sorter.tryAdjusting': 'Arama terimlerinizi değiştirmeyi veya filtreleri temizlemeyi deneyin.',

    // User Menu & Profile
    'user.viewProfile': 'Profili Görüntüle',
    'user.adminDashboard': 'Yönetim Paneli',
    'user.orgsAndVer': 'Kuruluşlar & Doğrulama',
    'user.accountSettings': 'Hesap Ayarları',
    'user.logOut': 'Çıkış Yap',
    'user.editProfile': 'Profili Düzenle',
    'user.savedTools': 'Kaydedilen Araçlar',
    'user.submittedTools': 'Eklenen Araçlar',

    // Notifications Drawer
    'notif.title': 'Bildirimler',
    'notif.newBadge': 'Yeni',
    'notif.markAllRead': 'Tümünü okundu yap',
    'notif.clearAll': 'Temizle',
    'notif.empty': 'Harika! Hiç okunmamış bildiriminiz yok.',
    'notif.inspect': 'İncele',

    // Footer
    'footer.apiAccess': 'API Erişimi',
    'footer.privacy': 'Gizlilik',
    'footer.aboutUs': 'Hakkımızda',
    'footer.submitTool': 'Araç Ekle',
    'footer.copyright': '© 2026 Guidora. Kapsamlı AI araçları dizini. Tüm hakları saklıdır.',

    // User Profile & Reviews
    'user.reviews': 'Yorumlarım',
    'user.noReviews': 'Henüz yorum yapılmadı',
    'user.noReviewsDesc': 'Dizindeki araçları değerlendirdiğinizde, puan ve yorumlarınız burada listelenecektir.',
    'user.deleteReview': 'Yorumu Sil',
    'user.confirmDeleteReview': 'Bu yorumu silmek istediğinize emin misiniz?',
    'user.viewTool': 'Aracı İncele',
    'user.shareProfile': 'Profili Paylaş',
    'user.copiedLink': 'Bağlantı kopyalandı!',
    'user.joined': 'Katılım',
    'user.reputation': 'İtibar',
    'user.platformAdmin': 'Platform Yöneticisi',
    'user.moderatorRole': 'Topluluk Moderatörü',
    'user.toolCreator': 'Araç Geliştiricisi',
    'user.communityMember': 'Topluluk Üyesi',

    // Reviews Tab in Tool Detail
    'reviews.title': 'Yorumlar ve Değerlendirmeler',
    'reviews.writeReview': 'Yorum Yaz',
    'reviews.postReview': 'Yorumu Gönder',
    'reviews.cancel': 'İptal',
    'reviews.deleteConfirm': 'Bu yorumu silmek istediğinize emin misiniz?',
    'reviews.deleteReview': 'Yorumu Sil',
    'reviews.helpful': 'Yararlı',
    'reviews.noReviewsYet': 'Henüz yorum yapılmamış. İlk deneyiminizi paylaşan siz olun!',

    // Admin Dashboard
    'admin.dashboard': 'Guidora Yönetim Merkezi',
    'admin.dashboardSubtitle': 'Kapsamlı platform yönetimi, yorum denetimi, etiket taksonomisi ve kullanıcı kontrolü.',
    'admin.tabOverview': 'Genel Bakış',
    'admin.tabTools': 'Araçlar',
    'admin.tabCategories': 'Kategoriler',
    'admin.tabTags': 'Etiketler ve Taksonomi',
    'admin.tabOrganizations': 'Kuruluşlar',
    'admin.tabUsers': 'Kullanıcılar ve Roller',
    'admin.tabReviews': 'Yorum Denetimi',
    'admin.tabReports': 'Bildirilen Raporlar',
    'admin.tabLogs': 'Denetim Kayıtları',
    'admin.tabSystem': 'Sistem ve Yedekleme',

    'admin.statTotalTools': 'Toplam Araç',
    'admin.statVerifiedTools': 'Onaylı Araçlar',
    'admin.statCategories': 'Kategoriler',
    'admin.statTags': 'Aktif Etiketler',
    'admin.statOrganizations': 'Kuruluşlar',
    'admin.statTotalUsers': 'Kullanıcılar',
    'admin.statTotalReviews': 'Toplam Yorum',
    'admin.statPendingReports': 'Bekleyen Raporlar',
    'admin.statTraffic': 'Tahmini Trafik',

    'admin.moderatorBanner': 'Moderatör Oturumu Aktif: İçerik ve yorum denetleme yetkisine sahipsiniz. Rol değiştirme, veritabanı sıfırlama ve ana kategori silme işlemleri için Yönetici (Admin) yetkisi gerekir.',
    'admin.lockedActionTooltip': 'Yönetici yetkisi gerekir (Moderatörler için kısıtlanmıştır)',
    'admin.moderatorRestricted': 'Moderatör Kısıtlaması',

    'admin.reviewsTitle': 'Yorum Denetleme Merkezi',
    'admin.reviewsSubtitle': 'Tüm dizin araçlarındaki kullanıcı yorumlarını ve puanlamalarını denetleyin, onaylayın veya silin.',
    'admin.searchReviews': 'Araç, yazar veya içeriğe göre yorum ara...',
    'admin.allRatings': 'Tüm Puanlar',
    'admin.reviewDeleted': 'Yorum başarıyla silindi',

    'admin.tagsTitle': 'Etiket ve Taksonomi Yönetimi',
    'admin.tagsSubtitle': 'Filtreleme sistemi için yetenek, platform, fiyatlandırma ve lisans etiketlerini yapılandırın.',
    'admin.addTag': 'Etiket Ekle',
    'admin.deleteTag': 'Etiketi Sil',
    'admin.tagCategory': 'Etiket Grubu',
    'admin.tagName': 'Etiket Adı',
    'admin.tagSlug': 'Etiket Kodu (Slug)',
    'admin.singleChoice': 'Yalnızca Tekli Seçim',
    'admin.confirmDeleteTag': 'Bu etiketi taksonomiden silmek istediğinize emin misiniz?',

    'admin.usersTitle': 'Kullanıcı ve Rol Yönetimi',
    'admin.usersSubtitle': 'Kullanıcı rollerini, itibar puanlarını, unvanlarını ve sistem erişim izinlerini yönetin.',
    'admin.editUser': 'Kullanıcıyı Düzenle',
    'admin.saveUser': 'Değişiklikleri Kaydet',
    'admin.userRole': 'Rol',
    'admin.userReputation': 'İtibar',
    'admin.userTitle': 'Mesleki Unvan',

    // Tool Detail, Status Cards & Tabs
    'tool.visitWebsite': 'Web Sitesini Ziyaret Et',
    'tool.save': 'Kaydet',
    'tool.saved': 'Kaydedildi',
    'tool.compare': 'Karşılaştır',
    'tool.monthlyVisits': 'Aylık Ziyaret',
    'tool.license': 'Lisans',
    'tool.createdBy': 'GELİŞTİRİCİ',
    'tool.similarTools': 'BENZER ARAÇLAR',
    'tool.reportListing': 'Bu araç listelemesini bildir',
    'tool.pricing': 'Fiyatlandırma',
    'tool.platform': 'Platform',
    'tool.access': 'Erişim',
    'tool.updated': 'Güncellendi',
    'tool.rank': 'SIRA',
    'tool.basedOnReviews': '{count} değerlendirmeye göre',
    'tool.verifiedBadge': 'Doğrulanmış Üye',
    'tabs.about': 'Hakkında ve Detaylar',
    'tabs.gallery': 'Galeri',
    'tabs.changelog': 'Değişiklik Günlüğü',
    'tabs.reviews': 'Yorumlar',
    'tabs.alternatives': 'Alternatifler',
    'tabs.overview': 'Genel Bakış',
    'tabs.keyFeatures': 'Önemli Özellikler',
    'tabs.capabilities': 'Temel Yetenekler',
    'tabs.docOverview': 'Dokümantasyon ve Genel Bakış',
    'tabs.classificationsAndTags': 'Sınıflandırmalar ve Etiketler',

    // Common
    'common.new': 'YENİ',
    'common.loadingMore': 'Daha fazla araç yükleniyor...',
    'common.cancel': 'İptal',
    'common.save': 'Kaydet',
    'common.delete': 'Sil',
    'common.back': 'Geri',
    'common.submit': 'Gönder',
    'common.success': 'Başarılı',

    // Auth Modal
    'auth.welcomeTitle': "Guidora'ya Hoş Geldiniz",
    'auth.welcomeSubtitle': 'Geliştiriciler ve Tasarımcılar İçin Araçlar',
    'auth.continueGoogle': 'Google ile Devam Et',
    'auth.continueGithub': 'Github ile Devam Et',
    'auth.continueEmail': 'E-posta ile Devam Et',
    'auth.noAccountYet': 'Henüz bir hesabınız yok mu?',
    'auth.createAccount': 'Hesap Oluştur',
    'auth.signInTitle': "Guidora'ya Giriş Yap",
    'auth.signInSubtitle': 'Hesabınıza erişmek için bilgilerinizi giriniz',
    'auth.adminTest': 'Admin testi:',
    'auth.quickFill': 'Hızlı Doldur',
    'auth.usernameOrEmail': 'Kullanıcı Adı veya E-posta',
    'auth.password': 'Şifre',
    'auth.confirmPassword': 'Şifreyi Onayla',
    'auth.signingIn': 'Giriş Yapılıyor...',
    'auth.signIn': 'Giriş Yap',
    'auth.back': 'Geri',
    'auth.needAccount': 'Hesaba mı ihtiyacınız var?',
    'auth.registerNow': 'Şimdi Kaydol',
    'auth.createAccountTitle': 'Hesabınızı Oluşturun',
    'auth.createAccountSubtitle': 'Bugün aramıza katılın ve keşfetmeye başlayın',
    'auth.username': 'Kullanıcı Adı',
    'auth.emailAddress': 'E-posta Adresi',
    'auth.agreeTerms': 'Kullanım Şartları ve Gizlilik Politikasını kabul ediyorum',
    'auth.subscribeNewsletter': 'Güncellemeler ve özel fırsatlar için bültene abone olun',
    'auth.creatingAccount': 'Hesap Oluşturuluyor...',
    'auth.alreadyHaveAccount': 'Zaten bir hesabınız var mı?',
    'auth.signInHere': 'Buradan giriş yapın',
    'auth.loginFailed': 'Giriş yapılamadı. Bilgilerinizi kontrol ediniz.',
    'auth.passwordsDoNotMatch': 'Girdiğiniz şifreler birbiriyle eşleşmiyor.',
    'auth.mustAgreeTerms': 'Lütfen Kullanım Şartları ve Gizlilik Politikasını kabul ediniz.',
    'auth.registerFailed': 'Kayıt işlemi gerçekleştirilemedi.',

    // Settings Modal
    'settings.title': 'Hesap & Güvenlik Ayarları',
    'settings.changePassword': 'Şifre Değiştir',
    'settings.changePasswordDesc': 'Hesabınızın güvenliği için güçlü ve benzersiz bir şifre kullanın.',
    'settings.currentPassword': 'Mevcut Şifre',
    'settings.newPassword': 'Yeni Şifre',
    'settings.confirmNewPassword': 'Yeni Şifre Tekrar',
    'settings.updatePassword': 'Şifreyi Güncelle',
    'settings.updating': 'Güncelleniyor...',
    'settings.passwordUpdated': 'Şifreniz başarıyla güncellendi.',
    'settings.passwordsMismatch': 'Yeni şifreler eşleşmiyor.',
    'settings.passwordMinLength': 'Şifre en az 6 karakter olmalıdır.',
    'settings.notificationsTitle': 'Bildirim Tercihleri',
    'settings.emailNotifications': 'E-posta Bildirimleri',
    'settings.emailNotificationsDesc': 'Platform güncellemeleri ve incelemeler hakkında e-posta alın.',
    'settings.weeklyDigest': 'Haftalık Bülten',
    'settings.weeklyDigestDesc': 'Haftada bir en popüler araçların ve trendlerin özeti.',
    'settings.securityTitle': 'Gelişmiş Güvenlik',
    'settings.twoFactor': 'İki Adımlı Doğrulama (2FA)',
    'settings.twoFactorDesc': 'Giriş yaparken ek bir güvenlik katmanı ekleyin.',

    // Report Modal
    'report.title': 'Araç Listelemesini Bildir',
    'report.reason': 'Bildirim Sebebi',
    'report.details': 'Ek Detaylar',
    'report.detailsPlaceholder': 'Sorunu açıklayın veya kanıt belirtin...',
    'report.yourEmail': 'E-posta Adresiniz (isteğe bağlı)',
    'report.submit': 'Bildirimi Gönder',
    'report.submitting': 'Gönderiliyor...',
    'report.success': 'Teşekkürler! Bildiriminiz moderasyon ekibine iletildi.',
    'report.reasonBrokenLink': 'Kırık Bağlantı / Servis Kapalı',
    'report.reasonBrokenLinkDesc': 'Web sitesi veya API uç noktası çalışmıyor veya erişilemez',
    'report.reasonOutdated': 'Güncelliğini Yitirmiş Bilgi',
    'report.reasonOutdatedDesc': 'Fiyatlandırma, özellikler veya sürüm bilgileri hatalı',
    'report.reasonSpam': 'Spam veya Zararlı İçerik',
    'report.reasonSpamDesc': 'Şüpheli zararlı yazılım veya yanıltıcı açıklama',
    'report.reasonCopyright': 'Telif Hakkı İhlali',
    'report.reasonCopyrightDesc': 'İzinsiz marka, fikri mülkiyet veya kod kullanımı',
    'report.reasonOther': 'Diğer Endişeler',
    'report.reasonOtherDesc': 'Mükerrer listeleme veya genel politika sorunu',

    // Submit Tool
    'submit.title': 'Yeni Yapay Zeka Aracı Ekle',
    'submit.subtitle': 'Otomatik GitHub veri çekme ve bot denetimi ile dizine katkıda bulunun.',
    'submit.importGithub': 'Otomatik GitHub İçe Aktarımı',
    'submit.fetchRepo': 'Repo Bilgilerini Çek',
    'submit.fetching': 'Çekiliyor...',
    'submit.toolName': 'Araç Adı',
    'submit.tagline': 'Kısa Slogan',
    'submit.category': 'Ana Kategori',
    'submit.websiteUrl': 'Resmi Web Sitesi',
    'submit.pricingType': 'Fiyatlandırma Modeli',
    'submit.platforms': 'Desteklenen Platformlar',
    'submit.submitBtn': 'Aracı Dizine Gönder',

    // TagPicker
    'tagPicker.tagsAndCapabilities': 'Etiketler ve Yetenekler (Sınırsız)',
    'tagPicker.selected': 'seçildi',
    'tagPicker.placeholder': 'Henüz etiket seçilmedi. Aracınıza eklemek için aşağıdaki etiketlere tıklayın (#Web, #Freemium, #LLM)...',
    'tagPicker.searchPlaceholder': 'Anahtar kelimeyle etiket ara (ör. #Interface, #Web, #Free)...',
    'tagPicker.az': 'A-Z',
    'tagPicker.category': 'Kategori',
    'tagPicker.noTagsMatching': 'ile eşleşen etiket bulunamadı',
    'tagPicker.noCatMatching': 'ile eşleşen kategori bulunamadı',
    'tagPicker.onlyOneAllowed': '(Sadece 1 seçilebilir)',
    'tagPicker.multipleAllowed': '(Birden fazla seçilebilir)',
    'tagPicker.removeTag': 'Kaldır',

    // User Profile Editing & Info
    'user.editProfileTitle': 'Profili Düzenle',
    'user.fullName': 'Ad Soyad',
    'user.fullNamePlaceholder': 'ör. Tahsin Cr',
    'user.avatarInitials': 'Profil Baş Harfleri',
    'user.professionalTitle': 'Mesleki Ünvan',
    'user.professionalTitlePlaceholder': 'ör. Kıdemli Yapay Zeka Mühendisi & Sistem Mimarı',
    'user.aboutBio': 'Hakkında / Biyografi',
    'user.aboutBioPlaceholder': 'Neler geliştirdiğiniz veya keşfettiğiniz hakkında kısa bir bilgi paylaşın...',
    'user.location': 'Konum',
    'user.locationPlaceholder': 'ör. İstanbul, Türkiye',
    'user.websiteUrl': 'Web Sitesi / GitHub URL',
    'user.saveChanges': 'Değişiklikleri Kaydet',
    'user.cancel': 'İptal',
    'user.loadingProfile': 'Kullanıcı profili yükleniyor...',
    'user.loadingTools': 'Araçlar yükleniyor...',
    'user.submittedEmptyDesc': 'Bu kullanıcı tarafından eklenen veya doğrulanmış araçlar burada listelenir.',

    // Language Dropdown
    'lang.selectLanguage': 'Dil Seçimi',

    // Admin Additional
    'admin.welcomeTitle': 'Guidora Yönetim Merkezine Hoş Geldiniz',
    'admin.welcomeSubtitle': 'Araçları incelemek, kategorileri düzenlemek veya doğrulanmış kuruluşları yönetmek için yukarıdaki sekmeleri kullanın.',
    'admin.confirmBatchDelete': 'Seçilen tüm {count} araç silinsin mi?',
    'admin.confirmReset': 'TEHLİKE: Tüm admin ayarlarını, özel araçları ve kategorileri fabrika ayarlarına sıfırlamak istediğinize emin misiniz?',

    // Gallery Placeholders
    'tabs.galleryPreview1': 'Ana Çalışma Alanı Önizlemesi',
    'tabs.galleryPreview2': 'Tuval ve Kod İnceleyici',

    // User Menu Modal
    'userMenu.orgModalTitle': 'Kuruluşlar & Doğrulama',
    'userMenu.orgPolicyNotice': 'Platform Doğrulama Politikası: Kuruluşlar standart araç ekleme formundan kaydedilemez. Guidora üzerindeki güvenilirliği sağlamak amacıyla yalnızca Yönetici Onayı veya otomatik Bot Doğrulaması ile onaylanırlar.',
    'userMenu.addOrgAdminOnly': 'Doğrulanmış Kuruluş Ekle (Yalnızca Admin)',
    'userMenu.orgNamePlaceholder': 'Kuruluş Adı',
    'userMenu.orgWebsitePlaceholder': 'Web Sitesi URL (https://...)',
    'userMenu.addOrgBtn': 'Doğrulanmış Kuruluş Oluştur',

    // User Menu Items
    'userMenu.viewProfile': 'Profili Görüntüle',
    'userMenu.adminDashboard': 'Yönetim Paneli',
    'userMenu.organizations': 'Kuruluşlar ve Doğrulama',
    'userMenu.accountSettings': 'Hesap Ayarları',
    'userMenu.logOut': 'Çıkış Yap',
    'userMenu.viewFullProfile': 'Profili Görüntüle',
    'userMenu.admin': 'Admin',

    // Admin Quick Cards & Sections
    'admin.manageToolsCardTitle': 'Rehber Araçlarını Yönet',
    'admin.manageToolsCardDesc': 'Doğrulama rozetlerini yönetin, topluluk gönderilerini denetleyin veya eski kayıtları kaldırın.',
    'admin.openToolsBtn': 'Araçları Aç →',
    'admin.configureCategoriesCardTitle': 'Kategorileri Yapılandır',
    'admin.configureCategoriesCardDesc': 'Özel kategoriler oluşturun, vurgu renklerini belirleyin ve popüler kaydırıcı etiketlerini yönetin.',
    'admin.openCategoriesBtn': 'Kategorileri Aç →',
    'admin.verifiedOrgsCardTitle': 'Doğrulanmış Kuruluşlar',
    'admin.verifiedOrgsCardDesc': 'Kuruluşlar oluşturun, kurumsal bağlantıları ve doğrulama durumlarını yönetin.',
    'admin.openOrganizationsBtn': 'Kuruluşları Aç →',

    // Admin Tools Management
    'admin.liveToolsTitle': 'Canlı Rehber Araçları',
    'admin.liveToolsSubtitle': 'Güven rozetlerini değiştirin, detayları inceleyin veya araçları canlı katalogdan kaldırın.',
    'admin.searchToolOrCat': 'Araç veya kategori ara...',
    'admin.verifySelected': 'Doğrula',
    'admin.deleteSelected': 'Sil',
    'admin.colTool': 'Araç',
    'admin.colCategory': 'Kategori',
    'admin.colPricing': 'Fiyatlandırma',
    'admin.colAdminVerified': 'Admin Onaylı',
    'admin.colCommunity': 'Topluluk',
    'admin.colBotAudited': 'Bot Denetimli',
    'admin.colActions': 'İşlemler',

    // Admin Categories
    'admin.categoriesTitle': 'Rehber Kategorileri',
    'admin.categoriesSubtitle': 'Karşılama kaydırıcısında ve filtre çekmecelerinde gösterilen kategorileri ekleyin, düzenleyin ve özelleştirin.',
    'admin.filterCategories': 'Kategorileri filtrele...',
    'admin.addCategory': 'Kategori Ekle',
    'admin.colCategoryName': 'Kategori Adı',
    'admin.colIdentifier': 'Tanımlayıcı',
    'admin.colAccentColor': 'Vurgu Rengi',
    'admin.colSliderPopular': 'Kaydırıcı / Popüler',
    'admin.featured': 'Öne Çıkan',
    'admin.standard': 'Standart',
    'admin.catNameEnLabel': 'Kategori Adı (İngilizce / Varsayılan)*',
    'admin.catNameTrLabel': 'Türkçe Çeviri (TR - İsteğe bağlı)',
    'admin.catNameRuLabel': 'Rusça Çeviri (RU - İsteğe bağlı)',
    'admin.accentColor': 'Vurgu Rengi',
    'admin.showOnTopSlider': 'Üst Kaydırıcıda Göster',
    'admin.createCategory': 'Kategori Oluştur',

    // Admin Tags
    'admin.tagNameEnLabel': 'Etiket Adı (İngilizce / Varsayılan)*',
    'admin.tagNameTrLabel': 'Türkçe Çeviri (TR - İsteğe bağlı)',
    'admin.tagNameRuLabel': 'Rusça Çeviri (RU - İsteğe bağlı)',
    'admin.createTag': 'Etiket Oluştur',

    // Admin Organizations
    'admin.orgsTitle': 'Doğrulanmış Kuruluşlar',
    'admin.orgsSubtitle': 'Guidora Yöneticileri tarafından doğrulanan kuruluşlar. Araçlar bu onaylı sahiplere bağlanabilir.',
    'admin.filterOrgs': 'Kuruluşları filtrele...',
    'admin.addOrganization': 'Kuruluş Ekle',
    'admin.colOrganization': 'Kuruluş',
    'admin.colWebsite': 'Web Sitesi',
    'admin.colSource': 'Kaynak',

    // Admin Reports
    'admin.reportsTitle': 'Topluluk Raporları ve Bildirimler',
    'admin.reportsSubtitle': 'Topluluk üyeleri tarafından bildirilen sorunları ve şikayetleri inceleyin.',
    'admin.reportsEmpty': 'Bekleyen topluluk bildirimi yok. Her şey tertemiz!',
    'admin.colReportId': 'Rapor ID',
    'admin.colToolId': 'Araç ID',
    'admin.colReason': 'Neden',
    'admin.colDetails': 'Detaylar',
    'admin.colStatus': 'Durum',
    'admin.statusResolved': 'Çözüldü',
    'admin.statusDismissed': 'Reddedildi',
    'admin.statusPending': 'Beklemede',

    // Admin System Maintenance
    'admin.systemTitle': 'Sistem Bakımı ve Veri Yönetimi',
    'admin.systemSubtitle': 'Rehber veri yedeklerini dışa aktarın, yedekten geri yükleyin veya yerel verileri sıfırlayın.',
    'admin.backupExportTitle': 'JSON Yedek Dışa Aktarma',
    'admin.backupExportDesc': 'Özel araçlarınızın, yeni kategorilerinizin, doğrulanmış kuruluşlarınızın ve denetim kayıtlarınızın tam yedeğini indirin.',
    'admin.exportBtn': 'Platform JSON Dışa Aktar',
    'admin.restoreTitle': 'Yedekten Geri Yükle',
    'admin.restoreDesc': 'Yerel rehber durumunu geri yüklemek için önceden dışa aktarılmış bir JSON dosyasını yükleyin.',
    'admin.restoreBtn': 'Yedek Dosyasını Yükle',
    'admin.resetTitle': 'Platform Verilerini Sıfırla',
    'admin.resetDesc': 'Tüm yönetici değişikliklerini temizleyerek varsayılan örnek verilere geri döner. Dikkatli kullanın.',
    'admin.resetBtn': 'Varsayılanlara Sıfırla',

    'admin.editCategory': 'Kategoriyi Düzenle',
    'admin.editTagCategory': 'Etiket Grubunu Düzenle',
    'admin.tagCategoryName': 'Etiket Grubu Adı',
    'admin.editTag': 'Etiketi Düzenle',
    'admin.manageTranslations': 'Çevirileri Yönet',
    'admin.translationModalTitle': 'Çok Dilli Çeviri Yöneticisi',
    'admin.translationModalDesc': 'Varsayılan İngilizce isme bağlı olarak tüm aktif diller için yerel çevirileri yönetin.',
    'admin.defaultEnglishName': 'Varsayılan İngilizce İsim',
    'admin.targetLanguages': 'Hedef Dil Çevirileri',
    'admin.fallbackNotice': 'Boş bırakılan dillerde otomatik olarak varsayılan İngilizce isim gösterilir.',
    'admin.saveTranslations': 'Çevirileri Kaydet',
    'admin.editToolStudio': 'Araç Düzenleme Stüdyosu',
    'admin.editToolStudioDesc': 'Meta verileri, taksonomileri, fiyatlandırmayı, rozetleri ve belgeleri güncelleyen tam kapsamlı editör.',
    'admin.editUserStudio': 'Kullanıcı Hesabı & Güvenlik Yönetimi',
    'admin.accountStatus': 'Hesap Durumu',
    'admin.statusActive': 'Aktif Hesap',
    'admin.statusSuspended': 'Askıya Alındı / Kısıtlı',
    'admin.verifiedUserBadge': 'Doğrulanmış Kullanıcı Rozeti',
    'admin.adminVerifiedBadge': 'Admin Doğrulaması Rozeti',
    'admin.communityChoiceBadge': 'Topluluk Seçimi Rozeti',
    'admin.botAuditedBadge': 'Bot Denetimli Rozeti',
    'admin.markFeatured': 'Öne Çıkarılan Olarak İşaretle',
    'admin.saveToolChanges': 'Değişiklikleri Kaydet',

    // Auth Extras
    'auth.artBadge': 'Guidora Zekası',
    'auth.artTitle': 'Yapay Zeka İnovasyonunu Başlatın',
    'auth.artSubtitle': 'Yüksek hassasiyetli modeller, geliştirici iş akışları ve doğrulanmış üretken araçlar.',
    'auth.usernamePlaceholder': 'Örn: admin@guidora.io veya kullanıcı adı',
    'auth.regUsernamePlaceholder': 'Örn: tahsincr',
    'auth.regEmailPlaceholder': 'adiniz@ornek.com',
  },

  ru: {
    // Header & Brand
    'header.submitTool': 'Добавить инструмент',
    'header.signIn': 'Войти',
    'header.searchPlaceholder': 'Поиск 12 000+ инструментов, промптов...',
    'header.switchToLight': 'Светлая тема',
    'header.switchToDark': 'Темная тема',
    'header.notifications': 'Уведомления',
    'header.directory': 'Каталог',
    'header.backToDirectory': 'Назад в каталог',

    // Hero / InformationCard
    'hero.titlePart1': 'Найдите',
    'hero.titleHighlight': 'Идеальный инструмент',
    'hero.titlePart2': 'для любой задачи',
    'hero.subtitle': 'Самый передовой каталог с глубокой фильтрацией, верификацией сообществом и автообновлениями.',
    'hero.allTools': 'Все инструменты',

    // Categories
    'cat.all': 'Все инструменты',
    'cat.generative-art': 'Генеративное искусство',
    'cat.developer-tools': 'Ассистенты для кода',
    'cat.design-ui': 'Генерация изображений',
    'cat.llms-ai': 'Чат-боты',
    'cat.video-motion': 'Генерация видео',
    'cat.data-science': 'Наука о данных',
    'cat.audio-music': 'Аудио и музыка',
    'cat.productivity': 'Продуктивность',
    'cat.3d-motion': '3D и анимация',

    // FilterBar
    'filter.filters': 'Фильтры',
    'filter.searchFilters': 'Поиск категорий, тегов...',
    'filter.clear': 'Очистить',
    'filter.clearFilters': 'Сбросить фильтры',
    'filter.activeFilters': 'Активные фильтры',
    'filter.categories': 'Категории',
    'filter.verification': 'Верификация',
    'filter.adminVerified': 'Проверено админом',
    'filter.communityChoice': 'Выбор сообщества',
    'filter.botAudited': 'Проверено ботом',
    'filter.organizations': 'Организации',
    'filter.showMore': 'Показать больше',
    'filter.showLess': 'Показать меньше',
    'filter.selectOnlyOne': 'Только один выбор',
    'filter.selectMultiple': 'Множественный выбор',

    // Tag Category Titles
    'tagCat.pricing': 'Цены и лицензирование',
    'tagCat.platform': 'Платформа и среда',
    'tagCat.capabilities': 'Возможности и архитектура',
    'tagCat.deployment': 'Развертывание и хостинг',
    'tagCat.license': 'Лицензия на ПО',

    // Tags
    'tag.free': 'Бесплатно',
    'tag.freemium': 'Freemium',
    'tag.paid': 'Платно / Enterprise',
    'tag.open-source': 'Open Source',
    'tag.free-trial': 'Пробный период',
    'tag.web': 'Веб',
    'tag.macos': 'macOS',
    'tag.windows': 'Windows',
    'tag.linux': 'Linux',
    'tag.ios': 'iOS',
    'tag.android': 'Android',
    'tag.cli': 'CLI',
    'tag.api': 'API',
    'tag.extension': 'Расширение',
    'tag.docker': 'Docker',
    'tag.wsl': 'WSL',
    'tag.cloud': 'Облачный SaaS',
    'tag.self-hosted': 'Self-Hosted',
    'tag.offline-local': 'Офлайн / Локально',
    'tag.serverless': 'Serverless',
    'tag.edge': 'Edge Compute',

    // SorterBar
    'sorter.relevance': 'По релевантности',
    'sorter.highestRated': 'По рейтингу',
    'sorter.mostViewed': 'По просмотрам',
    'sorter.newest': 'Сначала новые',
    'sorter.top': 'Топ',
    'sorter.thisMonth': 'За месяц',
    'sorter.thisWeek': 'За неделю',
    'sorter.viewGrid': 'Сетка',
    'sorter.viewList': 'Список',
    'sorter.noToolsFound': 'Инструментов по вашему запросу не найдено',
    'sorter.tryAdjusting': 'Попробуйте изменить поисковый запрос или сбросить фильтры.',

    // User Menu & Profile
    'user.viewProfile': 'Профиль',
    'user.adminDashboard': 'Панель управления',
    'user.orgsAndVer': 'Организации и верификация',
    'user.accountSettings': 'Настройки аккаунта',
    'user.logOut': 'Выйти',
    'user.editProfile': 'Редактировать профиль',
    'user.savedTools': 'Сохраненные',
    'user.submittedTools': 'Добавленные',

    // Notifications Drawer
    'notif.title': 'Уведомления',
    'notif.newBadge': 'Новое',
    'notif.markAllRead': 'Прочитать все',
    'notif.clearAll': 'Очистить',
    'notif.empty': 'Отлично! У вас нет непрочитанных уведомлений.',
    'notif.inspect': 'Посмотреть',

    // Footer
    'footer.apiAccess': 'API Доступ',
    'footer.privacy': 'Конфиденциальность',
    'footer.aboutUs': 'О нас',
    'footer.submitTool': 'Добавить инструмент',
    'footer.copyright': '© 2026 Guidora. Каталог передовых AI-инструментов. Все права защищены.',

    // User Profile & Reviews
    'user.reviews': 'Мои отзывы',
    'user.noReviews': 'Отзывов пока нет',
    'user.noReviewsDesc': 'Когда вы оставите отзыв об инструменте в каталоге, он появится здесь.',
    'user.deleteReview': 'Удалить отзыв',
    'user.confirmDeleteReview': 'Вы уверены, что хотите удалить этот отзыв?',
    'user.viewTool': 'Перейти к инструменту',
    'user.shareProfile': 'Поделиться профилем',
    'user.copiedLink': 'Ссылка скопирована!',
    'user.joined': 'Регистрация',
    'user.reputation': 'Репутация',
    'user.platformAdmin': 'Администратор платформы',
    'user.moderatorRole': 'Модератор сообщества',
    'user.toolCreator': 'Создатель инструментов',
    'user.communityMember': 'Участник сообщества',

    // Reviews Tab in Tool Detail
    'reviews.title': 'Отзывы и оценки',
    'reviews.writeReview': 'Написать отзыв',
    'reviews.postReview': 'Опубликовать',
    'reviews.cancel': 'Отмена',
    'reviews.deleteConfirm': 'Удалить этот отзыв?',
    'reviews.deleteReview': 'Удалить отзыв',
    'reviews.helpful': 'Полезно',
    'reviews.noReviewsYet': 'Отзывов пока нет. Будьте первым, кто поделится опытом!',

    // Admin Dashboard
    'admin.dashboard': 'Центр управления Guidora',
    'admin.dashboardSubtitle': 'Полное администрирование платформы, модерация отзывов, таксономия тегов и управление пользователями.',
    'admin.tabOverview': 'Обзор',
    'admin.tabTools': 'Инструменты',
    'admin.tabCategories': 'Категории',
    'admin.tabTags': 'Теги и таксономия',
    'admin.tabOrganizations': 'Организации',
    'admin.tabUsers': 'Пользователи и роли',
    'admin.tabReviews': 'Модерация отзывов',
    'admin.tabReports': 'Жалобы',
    'admin.tabLogs': 'Журнал аудита',
    'admin.tabSystem': 'Система и бэкапы',

    'admin.statTotalTools': 'Всего инструментов',
    'admin.statVerifiedTools': 'Проверенные',
    'admin.statCategories': 'Категории',
    'admin.statTags': 'Активные теги',
    'admin.statOrganizations': 'Организации',
    'admin.statTotalUsers': 'Пользователи',
    'admin.statTotalReviews': 'Всего отзывов',
    'admin.statPendingReports': 'Ожидающие жалобы',
    'admin.statTraffic': 'Примерный трафик',

    'admin.moderatorBanner': 'Сессия модератора активна: у вас есть доступ к модерации контента и отзывов. Смена ролей, сброс базы данных и удаление ключевых категорий требуют прав Администратора.',
    'admin.lockedActionTooltip': 'Требуются права Администратора (Ограничено для модераторов)',
    'admin.moderatorRestricted': 'Ограничено для модераторов',

    'admin.reviewsTitle': 'Центр модерации отзывов',
    'admin.reviewsSubtitle': 'Проверяйте и удаляйте нежелательные отзывы и оценки пользователей по всем инструментам каталога.',
    'admin.searchReviews': 'Поиск отзывов по инструменту, автору или тексту...',
    'admin.allRatings': 'Все оценки',
    'admin.reviewDeleted': 'Отзыв успешно удален',

    'admin.tagsTitle': 'Управление тегами и таксономией',
    'admin.tagsSubtitle': 'Настройка возможностей, платформ, типов цен и лицензий для системы фильтрации каталога.',
    'admin.addTag': 'Добавить тег',
    'admin.deleteTag': 'Удалить тег',
    'admin.tagCategory': 'Группа тегов',
    'admin.tagName': 'Название тега',
    'admin.tagSlug': 'Код тега (Slug)',
    'admin.singleChoice': 'Только единичный выбор',
    'admin.confirmDeleteTag': 'Удалить этот тег из таксономии?',

    'admin.usersTitle': 'Управление пользователями и ролями',
    'admin.usersSubtitle': 'Управляйте ролями пользователей, репутацией, должностями и правами доступа.',
    'admin.editUser': 'Редактировать пользователя',
    'admin.saveUser': 'Сохранить изменения',
    'admin.userRole': 'Роль',
    'admin.userReputation': 'Репутация',
    'admin.userTitle': 'Должность',

    // Tool Detail, Status Cards & Tabs
    'tool.visitWebsite': 'Посетить сайт',
    'tool.save': 'Сохранить',
    'tool.saved': 'Сохранено',
    'tool.compare': 'Сравнить',
    'tool.monthlyVisits': 'Посещений в месяц',
    'tool.license': 'Лицензия',
    'tool.createdBy': 'СОЗДАТЕЛЬ',
    'tool.similarTools': 'ПОХОЖИЕ ИНСТРУМЕНТЫ',
    'tool.reportListing': 'Пожаловаться на инструмент',
    'tool.pricing': 'Цены',
    'tool.platform': 'Платформа',
    'tool.access': 'Доступ',
    'tool.updated': 'Обновлено',
    'tool.rank': 'РАНГ',
    'tool.basedOnReviews': 'На основе {count} отзывов',
    'tool.verifiedBadge': 'Проверенный участник',
    'tabs.about': 'О программе и детали',
    'tabs.gallery': 'Галерея',
    'tabs.changelog': 'История изменений',
    'tabs.reviews': 'Отзывы',
    'tabs.alternatives': 'Альтернативы',
    'tabs.overview': 'Обзор',
    'tabs.keyFeatures': 'Ключевые возможности',
    'tabs.capabilities': 'Основные функции',
    'tabs.docOverview': 'Документация и обзор',
    'tabs.classificationsAndTags': 'Классификации и теги',

    // Common
    'common.new': 'НОВЫЙ',
    'common.loadingMore': 'Загрузка инструментов...',
    'common.cancel': 'Отмена',
    'common.save': 'Сохранить',
    'common.delete': 'Удалить',
    'common.back': 'Назад',
    'common.submit': 'Отправить',
    'common.success': 'Успешно',

    // Auth Modal
    'auth.welcomeTitle': 'Добро пожаловать в Guidora',
    'auth.welcomeSubtitle': 'Инструменты для разработчиков и дизайнеров',
    'auth.continueGoogle': 'Продолжить через Google',
    'auth.continueGithub': 'Продолжить через Github',
    'auth.continueEmail': 'Продолжить с email',
    'auth.noAccountYet': 'Еще нет аккаунта?',
    'auth.createAccount': 'Создать аккаунт',
    'auth.signInTitle': 'Вход в Guidora',
    'auth.signInSubtitle': 'Введите свои данные для входа в аккаунт',
    'auth.adminTest': 'Тест админа:',
    'auth.quickFill': 'Быстрое заполнение',
    'auth.usernameOrEmail': 'Имя пользователя или Email',
    'auth.password': 'Пароль',
    'auth.confirmPassword': 'Подтвердите пароль',
    'auth.signingIn': 'Вход...',
    'auth.signIn': 'Войти',
    'auth.back': 'Назад',
    'auth.needAccount': 'Нужен аккаунт?',
    'auth.registerNow': 'Зарегистрироваться',
    'auth.createAccountTitle': 'Создайте свой аккаунт',
    'auth.createAccountSubtitle': 'Присоединяйтесь к нам сегодня',
    'auth.username': 'Имя пользователя',
    'auth.emailAddress': 'Адрес электронной почты',
    'auth.agreeTerms': 'Я согласен с условиями использования и политикой конфиденциальности',
    'auth.subscribeNewsletter': 'Подпишитесь на рассылку для новостей и предложений',
    'auth.creatingAccount': 'Создание аккаунта...',
    'auth.alreadyHaveAccount': 'Уже есть аккаунт?',
    'auth.signInHere': 'Войти здесь',
    'auth.loginFailed': 'Не удалось войти. Проверьте введенные данные.',
    'auth.passwordsDoNotMatch': 'Пароли не совпадают.',
    'auth.mustAgreeTerms': 'Пожалуйста, примите условия использования.',
    'auth.registerFailed': 'Регистрация не удалась.',

    // Settings Modal
    'settings.title': 'Настройки аккаунта и безопасности',
    'settings.changePassword': 'Сменить пароль',
    'settings.changePasswordDesc': 'Используйте надежный пароль для защиты аккаунта.',
    'settings.currentPassword': 'Текущий пароль',
    'settings.newPassword': 'Новый пароль',
    'settings.confirmNewPassword': 'Подтвердите новый пароль',
    'settings.updatePassword': 'Обновить пароль',
    'settings.updating': 'Обновление...',
    'settings.passwordUpdated': 'Ваш пароль успешно обновлен.',
    'settings.passwordsMismatch': 'Новые пароли не совпадают.',
    'settings.passwordMinLength': 'Пароль должен содержать не менее 6 символов.',
    'settings.notificationsTitle': 'Настройки уведомлений',
    'settings.emailNotifications': 'Email-уведомления',
    'settings.emailNotificationsDesc': 'Получать оповещения об обновлениях и отзывах.',
    'settings.weeklyDigest': 'Еженедельный дайджест',
    'settings.weeklyDigestDesc': 'Сводка лучших инструментов раз в неделю.',
    'settings.securityTitle': 'Расширенная безопасность',
    'settings.twoFactor': 'Двухфакторная аутентификация (2FA)',
    'settings.twoFactorDesc': 'Дополнительный уровень защиты при входе.',

    // Report Modal
    'report.title': 'Пожаловаться на инструмент',
    'report.reason': 'Причина жалобы',
    'report.details': 'Дополнительные сведения',
    'report.detailsPlaceholder': 'Опишите проблему или предоставьте доказательства...',
    'report.yourEmail': 'Ваш Email (необязательно)',
    'report.submit': 'Отправить жалобу',
    'report.submitting': 'Отправка...',
    'report.success': 'Спасибо! Ваша жалоба отправлена команде модераторов.',
    'report.reasonBrokenLink': 'Неработающая ссылка / Сервис недоступен',
    'report.reasonBrokenLinkDesc': 'Сайт или API недоступны или удалены',
    'report.reasonOutdated': 'Устаревшая информация',
    'report.reasonOutdatedDesc': 'Цены, функции или спецификации неточны',
    'report.reasonSpam': 'Спам или вредоносный контент',
    'report.reasonSpamDesc': 'Подозрение на вредоносное ПО или обман',
    'report.reasonCopyright': 'Нарушение авторских прав',
    'report.reasonCopyrightDesc': 'Несанкционированное использование бренда или кода',
    'report.reasonOther': 'Другая причина',
    'report.reasonOtherDesc': 'Дубликат или нарушение правил',

    // Submit Tool
    'submit.title': 'Добавить новый AI-инструмент',
    'submit.subtitle': 'Внесите вклад в каталог с автоматическим извлечением данных из GitHub.',
    'submit.importGithub': 'Автоматический импорт из GitHub',
    'submit.fetchRepo': 'Получить данные репозитория',
    'submit.fetching': 'Загрузка...',
    'submit.toolName': 'Название инструмента',
    'submit.tagline': 'Краткое описание',
    'submit.category': 'Основная категория',
    'submit.websiteUrl': 'Официальный сайт',
    'submit.pricingType': 'Модель монетизации',
    'submit.platforms': 'Поддерживаемые платформы',
    'submit.submitBtn': 'Отправить в каталог',

    // TagPicker
    'tagPicker.tagsAndCapabilities': 'Теги и возможности (Без ограничений)',
    'tagPicker.selected': 'выбрано',
    'tagPicker.placeholder': 'Теги еще не выбраны. Нажмите на теги ниже, чтобы добавить их к инструменту (#Web, #Freemium, #LLM)...',
    'tagPicker.searchPlaceholder': 'Поиск тегов по ключевым словам (напр. #Interface, #Web, #Free)...',
    'tagPicker.az': 'А-Я',
    'tagPicker.category': 'Категория',
    'tagPicker.noTagsMatching': 'Нет совпадающих тегов',
    'tagPicker.noCatMatching': 'Нет совпадающих категорий',
    'tagPicker.onlyOneAllowed': '(Только 1 выбор)',
    'tagPicker.multipleAllowed': '(Множественный выбор)',
    'tagPicker.removeTag': 'Удалить',

    // User Profile Editing & Info
    'user.editProfileTitle': 'Редактировать профиль',
    'user.fullName': 'Полное имя',
    'user.fullNamePlaceholder': 'напр. Tahsin Cr',
    'user.avatarInitials': 'Инициалы аватара',
    'user.professionalTitle': 'Профессиональный статус',
    'user.professionalTitlePlaceholder': 'напр. Ведущий инженер ИИ & Архитектор продуктов',
    'user.aboutBio': 'О себе / Биография',
    'user.aboutBioPlaceholder': 'Расскажите немного о том, над чем работаете или что создаете...',
    'user.location': 'Местоположение',
    'user.locationPlaceholder': 'напр. Стамбул, Турция',
    'user.websiteUrl': 'Веб-сайт / Ссылка на GitHub',
    'user.saveChanges': 'Сохранить изменения',
    'user.cancel': 'Отмена',
    'user.loadingProfile': 'Загрузка профиля участника...',
    'user.loadingTools': 'Загрузка инструментов...',
    'user.submittedEmptyDesc': 'Инструменты, созданные или подтвержденные этим пользователем, появятся здесь.',

    // Language Dropdown
    'lang.selectLanguage': 'Выбор языка',

    // Admin Additional
    'admin.welcomeTitle': 'Добро пожаловать в командный центр Guidora',
    'admin.welcomeSubtitle': 'Выберите раздел выше для проверки инструментов, настройки категорий или управления организациями.',
    'admin.confirmBatchDelete': 'Удалить все {count} выбранных инструментов?',
    'admin.confirmReset': 'ОПАСНО: Вы уверены, что хотите сбросить все настройки администратора, инструменты и категории к исходным значениям?',

    // Gallery Placeholders
    'tabs.galleryPreview1': 'Предварительный просмотр рабочей области',
    'tabs.galleryPreview2': 'Инспектор холста и кода',

    // User Menu Modal
    'userMenu.orgModalTitle': 'Организации и верификация',
    'userMenu.orgPolicyNotice': 'Политика верификации: Организации нельзя зарегистрировать через обычную форму. Они строго проверяются через одобрение администратора или ботов.',
    'userMenu.addOrgAdminOnly': 'Добавить организацию (Только админ)',
    'userMenu.orgNamePlaceholder': 'Название организации',
    'userMenu.orgWebsitePlaceholder': 'URL сайта (https://...)',
    'userMenu.addOrgBtn': 'Создать верифицированную организацию',

    // User Menu Items
    'userMenu.viewProfile': 'Профиль',
    'userMenu.adminDashboard': 'Панель администратора',
    'userMenu.organizations': 'Организации и верификация',
    'userMenu.accountSettings': 'Настройки аккаунта',
    'userMenu.logOut': 'Выйти',
    'userMenu.viewFullProfile': 'Полный профиль',
    'userMenu.admin': 'Админ',

    // Admin Quick Cards & Sections
    'admin.manageToolsCardTitle': 'Управление инструментами каталога',
    'admin.manageToolsCardDesc': 'Управляйте значками верификации, проверяйте заявки сообщества и удаляйте устаревшие записи.',
    'admin.openToolsBtn': 'Открыть инструменты →',
    'admin.configureCategoriesCardTitle': 'Настройка категорий',
    'admin.configureCategoriesCardDesc': 'Создавайте категории, настраивайте цвета и управляйте тегами популярного слайдера.',
    'admin.openCategoriesBtn': 'Открыть категории →',
    'admin.verifiedOrgsCardTitle': 'Верифицированные организации',
    'admin.verifiedOrgsCardDesc': 'Создавайте организации, управляйте корпоративными связями и статусами проверки.',
    'admin.openOrganizationsBtn': 'Открыть организации →',

    // Admin Tools Management
    'admin.liveToolsTitle': 'Инструменты каталога',
    'admin.liveToolsSubtitle': 'Управляйте значками доверия, просматривайте детали или удаляйте инструменты из каталога.',
    'admin.searchToolOrCat': 'Поиск инструмента или категории...',
    'admin.verifySelected': 'Верифицировать',
    'admin.deleteSelected': 'Удалить',
    'admin.colTool': 'Инструмент',
    'admin.colCategory': 'Категория',
    'admin.colPricing': 'Цены',
    'admin.colAdminVerified': 'Верифицировано админом',
    'admin.colCommunity': 'Сообщество',
    'admin.colBotAudited': 'Проверено ботом',
    'admin.colActions': 'Действия',

    // Admin Categories
    'admin.categoriesTitle': 'Категории каталога',
    'admin.categoriesSubtitle': 'Добавляйте и настраивайте категории, отображаемые в карусели и фильтрах.',
    'admin.filterCategories': 'Фильтровать категории...',
    'admin.addCategory': 'Добавить категорию',
    'admin.colCategoryName': 'Название категории',
    'admin.colIdentifier': 'Идентификатор',
    'admin.colAccentColor': 'Цвет акцента',
    'admin.colSliderPopular': 'Слайдер / Популярное',
    'admin.featured': 'Рекомендуемое',
    'admin.standard': 'Стандартное',
    'admin.catNameEnLabel': 'Название категории (Английский / По умолчанию)*',
    'admin.catNameTrLabel': 'Турецкий перевод (TR - Необязательно)',
    'admin.catNameRuLabel': 'Русский перевод (RU - Необязательно)',
    'admin.accentColor': 'Цвет акцента',
    'admin.showOnTopSlider': 'Показывать в верхнем слайдере',
    'admin.createCategory': 'Создать категорию',

    // Admin Tags
    'admin.tagNameEnLabel': 'Название тега (Английский / По умолчанию)*',
    'admin.tagNameTrLabel': 'Турецкий перевод (TR - Необязательно)',
    'admin.tagNameRuLabel': 'Русский перевод (RU - Необязательно)',
    'admin.createTag': 'Создать тег',

    // Admin Organizations
    'admin.orgsTitle': 'Верифицированные организации',
    'admin.orgsSubtitle': 'Организации, проверенные администраторами Guidora. Инструменты могут быть привязаны к ним.',
    'admin.filterOrgs': 'Фильтровать организации...',
    'admin.addOrganization': 'Добавить организацию',
    'admin.colOrganization': 'Организация',
    'admin.colWebsite': 'Веб-сайт',
    'admin.colSource': 'Источник',

    // Admin Reports
    'admin.reportsTitle': 'Жалобы и отчеты сообщества',
    'admin.reportsSubtitle': 'Просматривайте жалобы и сообщения о проблемах от участников сообщества.',
    'admin.reportsEmpty': 'Нет ожидающих отчетов. Все чисто!',
    'admin.colReportId': 'ID отчета',
    'admin.colToolId': 'ID инструмента',
    'admin.colReason': 'Причина',
    'admin.colDetails': 'Детали',
    'admin.colStatus': 'Статус',
    'admin.statusResolved': 'Решено',
    'admin.statusDismissed': 'Отклонено',
    'admin.statusPending': 'В ожидании',

    // Admin System Maintenance
    'admin.systemTitle': 'Обслуживание системы и управление данными',
    'admin.systemSubtitle': 'Экспортируйте снимки данных каталога, восстанавливайте резервные копии или сбрасывайте данные.',
    'admin.backupExportTitle': 'Экспорт JSON резервной копии',
    'admin.backupExportDesc': 'Скачайте полный снимок пользовательских инструментов, категорий, организаций и журналов.',
    'admin.exportBtn': 'Экспортировать JSON',
    'admin.restoreTitle': 'Восстановление из снимка',
    'admin.restoreDesc': 'Загрузите ранее экспортированный файл JSON для мгновенного восстановления состояния каталога.',
    'admin.restoreBtn': 'Восстановить из файла',
    'admin.resetTitle': 'Сброс песочницы платформы',
    'admin.resetDesc': 'Очистить все изменения и восстановить исходные данные. Используйте с осторожностью.',
    'admin.resetBtn': 'Сбросить к исходным',

    'admin.editCategory': 'Редактировать категорию',
    'admin.editTagCategory': 'Редактировать группу тегов',
    'admin.tagCategoryName': 'Название группы тегов',
    'admin.editTag': 'Редактировать тег',
    'admin.manageTranslations': 'Управление переводами',
    'admin.translationModalTitle': 'Менеджер многоязычного перевода',
    'admin.translationModalDesc': 'Управляйте локализованными переводами относительно английского названия по умолчанию для всех активных языков.',
    'admin.defaultEnglishName': 'Английское название по умолчанию',
    'admin.targetLanguages': 'Переводы на целевые языки',
    'admin.fallbackNotice': 'Языки, оставленные пустыми, автоматически переключатся на английское название по умолчанию.',
    'admin.saveTranslations': 'Сохранить переводы',
    'admin.editToolStudio': 'Студия редактирования инструмента',
    'admin.editToolStudioDesc': 'Полнофункциональный редактор для обновления метаданных, таксономий, цен, значков и документации.',
    'admin.editUserStudio': 'Управление аккаунтом и безопасностью',
    'admin.accountStatus': 'Статус аккаунта',
    'admin.statusActive': 'Активный аккаунт',
    'admin.statusSuspended': 'Приостановлен / Ограничен',
    'admin.verifiedUserBadge': 'Значок верифицированного пользователя',
    'admin.adminVerifiedBadge': 'Значок проверки администратором',
    'admin.communityChoiceBadge': 'Значок выбора сообщества',
    'admin.botAuditedBadge': 'Значок аудита ботом',
    'admin.markFeatured': 'Отметить как рекомендуемое',
    'admin.saveToolChanges': 'Сохранить изменения',

    // Auth Extras
    'auth.artBadge': 'Интеллект Guidora',
    'auth.artTitle': 'Откройте инновации ИИ',
    'auth.artSubtitle': 'Высокоточные модели, рабочие процессы разработчиков и проверенные генеративные инструменты.',
    'auth.usernamePlaceholder': 'напр: admin@guidora.io или имя пользователя',
    'auth.regUsernamePlaceholder': 'напр: johndoe',
    'auth.regEmailPlaceholder': 'you@example.com',
  },
};

const LanguageContext = createContext();

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
];

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('guidora-lang');
      if (['en', 'tr', 'ru'].includes(saved)) return saved;

      // Detect browser language preferences
      const browserLangs = navigator.languages || [navigator.language || navigator.userLanguage || ''];
      for (const rawLang of browserLangs) {
        if (!rawLang) continue;
        const normalized = rawLang.toLowerCase();
        if (normalized.startsWith('tr')) return 'tr';
        if (normalized.startsWith('ru')) return 'ru';
        if (normalized.startsWith('en')) return 'en';
      }
    }
    return 'en'; // Global fallback
  });

  const [taxonomyTick, setTaxonomyTick] = useState(0);

  useEffect(() => {
    localStorage.setItem('guidora-lang', lang);
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  useEffect(() => {
    const handleTaxonomyChange = () => {
      setTaxonomyTick((t) => t + 1);
    };
    window.addEventListener('guidora_taxonomy_change', handleTaxonomyChange);
    return () => window.removeEventListener('guidora_taxonomy_change', handleTaxonomyChange);
  }, []);

  // Translation function helper
  const t = (key, fallback = '') => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || fallback || key;
  };

  // Helper to translate category names (checks dynamic admin translations with English fallback)
  const translateCategory = (catId, defaultName = '', catObj = null) => {
    let cat = catObj;
    if (!cat && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('guidora_custom_categories');
        if (raw) {
          const list = JSON.parse(raw);
          cat = list.find((c) => c.id === catId || c.name === catId || c.name === defaultName);
        }
      } catch (e) {}
    }

    if (cat?.translations) {
      if (lang === 'en') return cat.name || defaultName || catId;
      if (cat.translations[lang] && cat.translations[lang].trim()) {
        return cat.translations[lang].trim();
      }
      // Fallback to default English name if active language translation wasn't provided
      return cat.name || defaultName || catId;
    }

    const key = `cat.${catId}`;
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || defaultName || catId;
  };

  // Helper to translate tag category titles
  const translateTagCategory = (tagCatId, defaultName = '', catObj = null) => {
    let group = catObj;
    if (!group && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('guidora_custom_tags');
        if (raw) {
          const list = JSON.parse(raw);
          group = list.find((g) => g.id === tagCatId || g.name === defaultName);
        }
      } catch (e) {}
    }

    if (group?.translations) {
      if (lang === 'en') return group.name || defaultName || tagCatId;
      if (group.translations[lang] && group.translations[lang].trim()) {
        return group.translations[lang].trim();
      }
      return group.name || defaultName || tagCatId;
    }

    const key = `tagCat.${tagCatId}`;
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || defaultName || tagCatId;
  };

  // Helper to translate individual tags (checks dynamic admin translations with English fallback)
  const translateTag = (tagId, defaultName = '', tagObj = null) => {
    let tag = tagObj;
    if (!tag && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('guidora_custom_tags');
        if (raw) {
          const groups = JSON.parse(raw);
          for (const g of groups) {
            const found = (g.tags || []).find((t) => t.id === tagId || t.name === defaultName);
            if (found) {
              tag = found;
              break;
            }
          }
        }
      } catch (e) {}
    }

    if (tag?.translations) {
      if (lang === 'en') return tag.name || defaultName || tagId;
      if (tag.translations[lang] && tag.translations[lang].trim()) {
        return tag.translations[lang].trim();
      }
      // Fallback to default English name if active language translation wasn't provided
      return tag.name || defaultName || tagId;
    }

    const key = `tag.${tagId}`;
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || defaultName || tagId;
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        t,
        translateCategory,
        translateTagCategory,
        translateTag,
        taxonomyVersion: taxonomyTick,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
