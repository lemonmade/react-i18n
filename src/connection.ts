import {TranslationDictionary} from './types';
import {noop} from './utilities';

export interface TranslationGetter {
  (locale: string):
    | TranslationDictionary
    | Promise<TranslationDictionary | undefined | void>
    | undefined
    | void;
}

export interface Options {
  id: string;
  fallback?: TranslationDictionary;
  translations?: TranslationGetter;
}

export default class Connection {
  public id: Options['id'];
  public parent?: Connection;
  public fallbackTranslations: Options['fallback'];
  public translationsForLocale: TranslationGetter;

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
