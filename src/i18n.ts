import {
  I18nDetails,
  PrimitiveReplacementDictionary,
  ComplexReplacementDictionary,
  TranslationDictionary,
  LanguageDirection,
} from './types';
import {MissingCurrencyCodeError, MissingTimezoneError} from './errors';
import {translate} from './utilities';

export interface NumberFormatOptions extends Intl.NumberFormatOptions {
  as?: 'number' | 'currency' | 'percent';
  precision?: number;
}

/* eslint-disable line-comment-position */
// See https://en.wikipedia.org/wiki/Right-to-left
const RTL_LANGUAGES = [
  'ae', // Avestan
  'ar', // 'العربية', Arabic
  'arc', // Aramaic
  'bcc', // 'بلوچی مکرانی', Southern Balochi
  'bqi', // 'بختياري', Bakthiari
  'ckb', // 'Soranî / کوردی', Sorani
  'dv', // Dhivehi
  'fa', // 'فارسی', Persian
  'glk', // 'گیلکی', Gilaki
  'he', // 'עברית', Hebrew
  'ku', // 'Kurdî / كوردی', Kurdish
  'mzn', // 'مازِرونی', Mazanderani
  'nqo', // N'Ko
  'pnb', // 'پنجابی', Western Punjabi
  'ps', // 'پښتو', Pashto,
  'sd', // 'سنڌي', Sindhi
  'ug', // 'Uyghurche / ئۇيغۇرچە', Uyghur
  'ur', // 'اردو', Urdu
  'yi', // 'ייִדיש', Yiddish
];
/* eslint-enable */

export default class I18n {
  locale: string;
  defaultCurrency?: string;
  defaultTimezone?: string;

  get language(): string {
    return this.locale.split('-')[0];
  }

  get languageDirection() {
    return RTL_LANGUAGES.includes(this.language)
      ? LanguageDirection.Rtl
      : LanguageDirection.Ltr;
  }

  get isRtlLanguage() {
    return this.languageDirection === LanguageDirection.Rtl;
  }

  get isLtrLanguage() {
    return this.languageDirection === LanguageDirection.Ltr;
  }

  get countryCode(): string | undefined {
    return this.locale.split('-')[1];
  }

  constructor(
    public translations: TranslationDictionary[],
    {locale, currency, timezone}: I18nDetails,
  ) {
    this.locale = locale.toLowerCase();
    this.defaultCurrency = currency;
    this.defaultTimezone = timezone;
  }

  translate(id: string, replacements?: PrimitiveReplacementDictionary): string;
  translate(
    id: string,
    replacements?: ComplexReplacementDictionary,
  ): React.ReactElement<any>;
  translate(
    id: string,
    replacements?:
      | PrimitiveReplacementDictionary
      | ComplexReplacementDictionary,
  ): any {
    return translate(id, this.translations, this.locale, replacements);
  }

  formatNumber(
    amount: number,
    {as, precision, ...options}: NumberFormatOptions = {},
  ) {
    const {locale, defaultCurrency: currency} = this;

    if (as === 'currency' && currency == null && options.currency == null) {
      throw new MissingCurrencyCodeError(
        `No currency code provided. formatNumber(amount, {as: 'currency'}) cannot be called without a currency code.`,
      );
    }

    return new Intl.NumberFormat(locale, {
      style: as,
      maximumFractionDigits: precision,
      currency,
      ...options,
    }).format(amount);
  }

  formatDate(date: Date, options?: Intl.DateTimeFormatOptions) {
    const {locale, defaultTimezone: timezone} = this;

    if (timezone == null && (options == null || options.timeZone == null)) {
      throw new MissingTimezoneError(
        `No timezone code provided. formatDate() cannot be called without a timezone.`,
      );
    }

    return new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      ...options,
    }).format(date);
  }
}
