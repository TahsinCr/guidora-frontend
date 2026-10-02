import { describe, it, expect } from 'vitest';
import { TRANSLATIONS } from '@/context/LanguageContext';

describe('Multi-Language Parity & Localization Completeness (EN, TR, RU)', () => {
  const languages = ['en', 'tr', 'ru'];

  it('provides all 3 supported languages in TRANSLATIONS dictionary', () => {
    languages.forEach((lang) => {
      expect(TRANSLATIONS[lang]).toBeDefined();
      expect(typeof TRANSLATIONS[lang]).toBe('object');
    });
  });

  it('guarantees 100% key parity between English, Turkish, and Russian', () => {
    const enKeys = Object.keys(TRANSLATIONS.en);
    const trKeys = Object.keys(TRANSLATIONS.tr);
    const ruKeys = Object.keys(TRANSLATIONS.ru);

    expect(enKeys.length).toBeGreaterThan(650);
    expect(trKeys.length).toBe(enKeys.length);
    expect(ruKeys.length).toBe(enKeys.length);

    const missingInTr = enKeys.filter((key) => TRANSLATIONS.tr[key] === undefined);
    const missingInRu = enKeys.filter((key) => TRANSLATIONS.ru[key] === undefined);

    expect(missingInTr).toEqual([]);
    expect(missingInRu).toEqual([]);
  });

  it('ensures no empty string or whitespace-only translation values', () => {
    languages.forEach((lang) => {
      const dict = TRANSLATIONS[lang];
      Object.entries(dict).forEach(([key, val]) => {
        expect(typeof val).toBe('string');
        expect(val.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it('covers all administrative tabs, proposals, schemas, and confirmation keys', () => {
    const criticalAdminKeys = [
      'admin.tabOverview',
      'admin.tabTools',
      'admin.tabProposals',
      'admin.tabSchema',
      'admin.tabLogs',
      'admin.tabCategories',
      'admin.tabTags',
      'admin.tabUsers',
      'admin.tabOrganizations',
      'admin.tabReports',
      'admin.tabReviews',
      'admin.tabSystem',
      'admin.proposalPresetIncomplete',
      'admin.proposalPresetSpam',
      'admin.statusPendingReview',
      'admin.statusApproved',
      'admin.statusRejected',
      'admin.proposalChangeTitle',
      'admin.proposalAcceptApply',
      'admin.confirmTitleDefault',
      'admin.confirmBtnConfirm',
      'admin.confirmBtnCancel',
      'admin.processing',
      'admin.schemaTitle',
      'admin.schemaSub',
      'admin.traceIdCopied',
      'admin.overviewTitle',
      'admin.backToDirectory',
      'admin.reportsEmptyDesc',
      'admin.colRatingVotes',
    ];

    criticalAdminKeys.forEach((key) => {
      languages.forEach((lang) => {
        expect(TRANSLATIONS[lang][key], `Missing ${key} in ${lang}`).toBeDefined();
        expect(TRANSLATIONS[lang][key].length).toBeGreaterThan(0);
      });
    });
  });
});
