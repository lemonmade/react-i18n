import {
  I18nDetails,
  PrimitiveReplacementDictionary,
  ComplexReplacementDictionary,
  TranslationDictionary,
} from './types';

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

    if (as === 'currency' && currency == null) {
      throw new Error(
        `No currency code provided. format() as currency cannot be called without a currency code.`,
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

    if (timezone == null) {
      throw new Error(
        `No timezone code provided. format() cannot be called without a timezone code.`,
      );
    }

    return new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      ...(options as Intl.DateTimeFormatOptions),
    }).format(date);
  }
}
