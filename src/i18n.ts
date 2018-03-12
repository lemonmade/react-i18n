import {
  I18nDetails,
  PrimitiveReplacementDictionary,
  ComplexReplacementDictionary,
  TranslationDictionary,
} from './types';
import {MissingCurrencyCodeError, MissingTimezoneError} from './errors';
import {translate} from './utilities';

export interface NumberFormatOptions extends Intl.NumberFormatOptions {
  as?: 'number' | 'currency' | 'percent';
  precision?: number;
}

export default class I18n {
  constructor(
    public translations: TranslationDictionary[],
    public details: I18nDetails,
  ) {}

  translate(id: string, replacements?: PrimitiveReplacementDictionary): string;
  translate(
    id: string,
    replacements?: ComplexReplacementDictionary,
  ): React.ReactElement<any>;
  translate(id: string, replacements: any): any {
    return translate(id, this.translations, replacements);
  }

  formatNumber(
    amount: number,
    {as, precision, ...options}: NumberFormatOptions = {},
  ) {
    const {locale, currency} = this.details;

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
    const {locale, timezone} = this.details;

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
