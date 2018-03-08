import {TranslationDictionary} from './types';
import {noop} from './utilities';

export type TranslationDictionaryResult =
  | TranslationDictionary
  | Promise<TranslationDictionary | undefined>
  | undefined;

export interface Options {
  id: string;
  fallback?: TranslationDictionary;
  translations(locale: string): TranslationDictionaryResult;
}

export default class Connection {
  public id: Options['id'];
  public parent?: Connection;
  public fallbackTranslations: Options['fallback'];
  public translationsForLocale: Options['translations'];

  constructor({id, fallback, translations = noop}: Options) {
    this.id = id;
    this.fallbackTranslations = fallback;
    this.translationsForLocale = translations;
  }

  extend(options: Options) {
    const child = new Connection(options);
    child.parent = this;
    return child;
  }
}
