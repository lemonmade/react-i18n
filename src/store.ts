import {I18nDetails} from './types';

export interface Subscriber {
  (i18nDetails: I18nDetails): void;
}

export interface Subscription {
  unsubscribe(): void;
}

export default class I18nStore implements I18nDetails {
  locale: string;
  currency?: string;
  timezone?: string;

  private subscriptions = new Set<Subscriber>();

  constructor({locale, currency, timezone}: I18nDetails) {
    this.locale = locale;
    this.currency = currency;
    this.timezone = timezone;
  }

  subscribe(subscription: Subscriber): Subscription {
    this.subscriptions.add(subscription);

    return {
      unsubscribe: () => this.subscriptions.delete(subscription),
    };
  }

  update({locale, currency, timezone}: Partial<I18nDetails>) {
    if (locale) {
      this.locale = locale;
    }

    if (currency) {
      this.currency = currency;
    }

    if (timezone) {
      this.timezone = timezone;
    }

    for (const subscription of this.subscriptions) {
      subscription(this);
    }
  }
}
