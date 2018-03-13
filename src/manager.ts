import {I18nDetails, TranslationDictionary} from './types';
import Connection from './connection';

export interface ConnectionState {
  translations: TranslationDictionary[];
  loading: boolean;
}

export interface Subscriber {
  (connectionState: ConnectionState): void;
}

export interface ConnectionResult {
  disconnect(): void;
}

export default class Manager {
  public loading = false;
  private subscriptions = new Map<Subscriber, Connection>();
  private translations = new Map<
    string,
    | TranslationDictionary
    | Promise<TranslationDictionary | undefined>
    | undefined
  >();

  constructor(public details: I18nDetails) {}

  async extract() {
    const translationPairs = Array.from(this.translations.entries());
    const extractedTranslations: {
      [key: string]: TranslationDictionary | undefined;
    } = {};

    await Promise.all(
      translationPairs.map(async ([id, translationDictionary]) => {
        const resolvedTranslationDictionary = isPromise(translationDictionary)
          ? await translationDictionary
          : translationDictionary;
        extractedTranslations[id] = resolvedTranslationDictionary;
      }),
    );

    return extractedTranslations;
  }

  connect(connection: Connection, subscriber: Subscriber): ConnectionResult {
    const possibleLocales = getPossibleLocales(this.details.locale);

    for (const locale of possibleLocales) {
      const id = localeId(connection, locale);

      if (this.translations.has(id)) {
        continue;
      }

      const translations = connection.translationsForLocale(locale);

      if (isPromise(translations)) {
        this.translations.set(
          id,
          translations.then(result => {
            this.translations.set(id, result);
            this.updateSubscribersForId(id);
            return result;
          }),
        );
      } else {
        this.translations.set(id, translations);
      }
    }

    this.subscriptions.set(subscriber, connection);

    return {
      disconnect: () => this.subscriptions.delete(subscriber),
    };
  }

  state(connection: Connection): ConnectionState {
    const parentState = connection.parent
      ? this.state(connection.parent)
      : {loading: false, translations: []};

    const fallbackTranslations = connection.fallbackTranslations
      ? [connection.fallbackTranslations]
      : [];

    if (parentState.loading) {
      return {
        ...parentState,
        translations: [...fallbackTranslations, ...parentState.translations],
      };
    }

    const possibleLocales = getPossibleLocales(this.details.locale);
    const translations = possibleLocales.map(locale =>
      this.translations.get(localeId(connection, locale)),
    );

    if (noPromises(translations)) {
      return {
        loading: false,
        translations: [
          ...filterUndefined(translations),
          ...fallbackTranslations,
          ...parentState.translations,
        ],
      };
    } else {
      // TODO; need to isolate to only parent fallbacks
      return {
        loading: true,
        translations: [...fallbackTranslations, ...parentState.translations],
      };
    }
  }

  update(details: I18nDetails) {
    this.details = details;
    const possibleLocales = getPossibleLocales(details.locale);

    for (const connection of this.subscriptions.values()) {
      for (const locale of possibleLocales) {
        const id = localeId(connection, locale);

        if (this.translations.has(id)) {
          continue;
        }

        const translations = connection.translationsForLocale(locale);

        if (isPromise(translations)) {
          this.translations.set(
            id,
            translations.then(result => {
              this.translations.set(id, result);
              this.updateSubscribersForId(id);
              return result;
            }),
          );
        } else {
          this.translations.set(id, translations);
        }
      }
    }

    for (const [subscription, connection] of this.subscriptions.entries()) {
      subscription(this.state(connection));
    }
  }

  private updateSubscribersForId(id: string) {
    for (const [subscriber, connection] of this.subscriptions.entries()) {
      if (
        localeIdsForConnection(connection, this.details.locale).includes(id)
      ) {
        subscriber(this.state(connection));
      }
    }
  }
}

function localeIdsForConnection(connection: Connection, fullLocale: string) {
  return getPossibleLocales(fullLocale).map(locale =>
    localeId(connection, locale),
  );
}

function getPossibleLocales(locale: string) {
  const normalizedLocale = locale.toLowerCase();
  const split = normalizedLocale.split('-');
  return split.length > 1 ? [normalizedLocale, split[0]] : [normalizedLocale];
}

function isPromise<T>(
  possiblePromise: T | Promise<T>,
): possiblePromise is Promise<T> {
  return possiblePromise != null && (possiblePromise as any).then != null;
}

function filterUndefined<T>(array: (T | undefined)[]): T[] {
  return array.filter(Boolean) as T[];
}

function localeId(connection: Connection, locale: string) {
  return `${connection.id}${locale}`;
}

function noPromises<T>(array: (T | Promise<T>)[]): array is T[] {
  return array.every(item => !isPromise(item));
}
