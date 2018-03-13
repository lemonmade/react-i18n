jest.mock('../utilities', () => ({
  translate: jest.fn(),
}));

import I18n from '../i18n';
import {MissingCurrencyCodeError, MissingTimezoneError} from '../errors';

const translate: jest.Mock = require('../utilities').translate;

describe('I18n', () => {
  const defaultDetails = {locale: 'en-ca'};
  const defaultTranslations = [{hello: 'Hello, {name}!'}];

  beforeEach(() => {
    translate.mockReset();
  });

  describe('#translate()', () => {
    it('calls the translate() utility with translations, key, and replacements', () => {
      const mockResult = 'translated string';
      const replacements = {name: 'Chris'};
      translate.mockReturnValue(mockResult);

      const i18n = new I18n(defaultTranslations, defaultDetails);
      const result = i18n.translate('hello', replacements);

      expect(result).toBe(mockResult);
      expect(translate).toHaveBeenCalledWith(
        'hello',
        defaultTranslations,
        replacements,
      );
    });
  });

  describe('#formatNumber()', () => {
    it('formats a number using Intl', () => {
      const i18n = new I18n(defaultTranslations, defaultDetails);
      const expected = new Intl.NumberFormat(defaultDetails.locale).format(
        1000,
      );

      expect(i18n.formatNumber(1000)).toBe(expected);
    });

    it('uses the precision argument for maximumFractionDigits', () => {
      const i18n = new I18n(defaultTranslations, defaultDetails);
      const precision = 2;
      const expected = new Intl.NumberFormat(defaultDetails.locale, {
        maximumFractionDigits: precision,
      }).format(0.12345);

      expect(i18n.formatNumber(0.12345, {precision})).toBe(expected);
    });

    it('passes additional options to the number formatter', () => {
      const i18n = new I18n(defaultTranslations, defaultDetails);
      const options: Partial<Intl.NumberFormatOptions> = {
        currencyDisplay: 'code',
        minimumIntegerDigits: 1,
        maximumFractionDigits: 1,
      };

      const expected = new Intl.NumberFormat(
        defaultDetails.locale,
        options,
      ).format(0.12345);

      expect(i18n.formatNumber(0.12345, options)).toBe(expected);
    });

    describe('currency', () => {
      const currency = 'USD';

      it('throws an error when no currency code is given as the default or as an option', () => {
        const i18n = new I18n(defaultTranslations, defaultDetails);
        expect(() => i18n.formatNumber(1, {as: 'currency'})).toThrowError(
          MissingCurrencyCodeError,
        );
      });

      it('uses the Intl number formatter with the default currency', () => {
        const i18n = new I18n(defaultTranslations, {
          ...defaultDetails,
          currency,
        });

        const expected = Intl.NumberFormat(defaultDetails.locale, {
          style: 'currency',
          currency,
        }).format(1);

        expect(i18n.formatNumber(1, {as: 'currency'})).toBe(expected);
      });

      it('uses a custom currency provided in options', () => {
        const i18n = new I18n(defaultTranslations, defaultDetails);
        const expected = Intl.NumberFormat(defaultDetails.locale, {
          style: 'currency',
          currency,
        }).format(1);

        expect(i18n.formatNumber(1, {as: 'currency', currency})).toBe(expected);
      });

      it('passes additional options to the number formatter', () => {
        const i18n = new I18n(defaultTranslations, {
          ...defaultDetails,
          currency,
        });

        const options: Partial<Intl.NumberFormatOptions> = {
          currencyDisplay: 'code',
          minimumIntegerDigits: 1,
        };

        const expected = Intl.NumberFormat(defaultDetails.locale, {
          style: 'currency',
          currency,
          ...options,
        }).format(1);

        expect(i18n.formatNumber(1, {as: 'currency', ...options})).toBe(
          expected,
        );
      });
    });

    describe('percent', () => {
      it('formats the number as a percentage', () => {
        const i18n = new I18n(defaultTranslations, defaultDetails);
        const expected = Intl.NumberFormat(defaultDetails.locale, {
          style: 'percent',
        }).format(50);
        expect(i18n.formatNumber(50, {as: 'percent'})).toBe(expected);
      });
    });
  });

  describe('#formatDate()', () => {
    const timezone = 'Australia/Sydney';

    it('formats a date using Intl', () => {
      const date = new Date();
      const i18n = new I18n(defaultTranslations, {...defaultDetails, timezone});
      const expected = new Intl.DateTimeFormat(defaultDetails.locale, {
        timeZone: timezone,
      }).format(date);
      expect(i18n.formatDate(date)).toBe(expected);
    });

    it('passes additional options to the date formatter', () => {
      const date = new Date();
      const i18n = new I18n(defaultTranslations, {...defaultDetails, timezone});
      const options: Partial<Intl.DateTimeFormatOptions> = {
        era: 'narrow',
      };

      const expected = new Intl.DateTimeFormat(defaultDetails.locale, {
        timeZone: timezone,
        ...options,
      }).format(date);

      expect(i18n.formatDate(date, options)).toBe(expected);
    });

    it('throws an error when no timezone is given as the default or as an option', () => {
      const i18n = new I18n(defaultTranslations, defaultDetails);
      expect(() => i18n.formatDate(new Date())).toThrowError(
        MissingTimezoneError,
      );
    });

    it('uses the Intl number formatter with the default timezone', () => {
      const date = new Date();
      const i18n = new I18n(defaultTranslations, {
        ...defaultDetails,
        timezone,
      });

      const expected = new Intl.DateTimeFormat(defaultDetails.locale, {
        timeZone: timezone,
      }).format(date);

      expect(i18n.formatDate(date)).toBe(expected);
    });

    it('uses a custom timezone provided in options', () => {
      const date = new Date();
      const i18n = new I18n(defaultTranslations, defaultDetails);
      const expected = new Intl.DateTimeFormat(defaultDetails.locale, {
        timeZone: timezone,
      }).format(date);

      expect(i18n.formatDate(date, {timeZone: timezone})).toBe(expected);
    });
  });
});
