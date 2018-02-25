import * as React from 'react';
import * as PropTypes from 'prop-types';

import hoistStatics = require('hoist-non-react-statics');
import {getDisplayName} from '@shopify/react-utilities/components';
import {ReactComponent} from '@shopify/react-utilities/types';

import I18n from './I18n';
import I18nStore, {Subscription} from './store';
import {TranslationDictionary, I18nDetails} from './types';
import {contextTypes} from './Provider';

interface Context {
  i18nStore: I18nStore;
  i18n?: I18n;
}

export interface WithI18nOptions {
  displayName?: string;
  fallback?: TranslationDictionary;
  translations?(
    locale: string,
  ): TranslationDictionary | Promise<TranslationDictionary> | undefined;
}

export interface WithI18nProps {
  i18n: I18n;
}

export interface State {
  i18n: I18n;
  loading: boolean;
}

export function withI18n({
  displayName,
  fallback,
  translations,
}: WithI18nOptions = {}) {
  return function addI18n<OwnProps, C>(
    WrappedComponent: ReactComponent<OwnProps & WithI18nProps> & C,
  ): ReactComponent<OwnProps> & C {
    class WithTranslation extends React.Component<OwnProps, State> {
      static displayName = `withI18n(${displayName ||
        getDisplayName(WrappedComponent)})`;
      static WrappedComponent = WrappedComponent;
      static contextTypes = contextTypes;
      static childContextTypes = {i18n: PropTypes.instanceOf(I18n)};

      state: State = {
        i18n: new I18n(
          fallback
            ? [fallback, ...this.parentTranslations]
            : this.parentTranslations,
          this.context.i18nStore,
        ),
        loading: false,
      };

      private subscription?: Subscription;
      private localeChangeIndex = 0;
      private mounted = false;
      private translationCache = new Map<string, TranslationDictionary[]>();

      private get parentTranslations(): TranslationDictionary[] {
        const context: Context = this.context;
        return context.i18n ? context.i18n.translations : [];
      }

      asyncBootstrap() {
        return this.updateI18n(this.context.i18nStore);
      }

      getChildContext() {
        return {i18n: this.state.i18n};
      }

      componentDidMount() {
        this.mounted = true;

        const context: Context = this.context;
        const {i18nStore} = context;

        this.updateI18n(i18nStore);

        this.subscription = i18nStore.subscribe(i18nDetails => {
          this.updateI18n(i18nDetails);
        });
      }

      componentWillUnmount() {
        this.mounted = false;
        this.subscription!.unsubscribe();
      }

      render() {
        return <WrappedComponent {...this.props} i18n={this.state.i18n} />;
      }

      private async updateI18n(details: I18nDetails) {
        const ownTranslations = this.getTranslations(details.locale);
        let currentTranslations: TranslationDictionary[];

        if (isPromise(ownTranslations)) {
          currentTranslations = fallback
            ? [fallback, ...this.parentTranslations]
            : this.parentTranslations;
        } else {
          currentTranslations = [
            ...ownTranslations,
            ...this.parentTranslations,
          ];
        }

        this.setState({
          i18n: new I18n(currentTranslations, details),
          loading: isPromise(ownTranslations),
        });

        const index = ++this.localeChangeIndex;

        if (isPromise(ownTranslations)) {
          const resolvedOwnTranslations = await ownTranslations;
          if (this.localeChangeIndex !== index || !this.mounted) {
            return;
          }

          this.setState({
            i18n: new I18n(
              [...resolvedOwnTranslations, ...this.parentTranslations],
              details,
            ),
            loading: false,
          });
        }
      }

      private getTranslations(
        locale: string,
      ): TranslationDictionary[] | Promise<TranslationDictionary[]> {
        const {translationCache} = this;

        if (translationCache.has(locale)) {
          return translationCache.get(locale)!;
        }

        const translationResults = filterUndefined(
          (translations && getPossibleLocales(locale).map(translations)) || [],
        );

        if (!isArrayOfPromises(translationResults)) {
          const castTranslations: TranslationDictionary[] = translationResults as any;
          translationCache.set(locale, castTranslations);
          return castTranslations;
        }

        return new Promise(resolve => {
          let finished = 0;
          const translationDictionaries: TranslationDictionary[] = [];

          function addTranslationDictionary(
            dictionary?: TranslationDictionary,
          ) {
            if (dictionary) {
              translationDictionaries.push(dictionary);
            }

            finished += 1;
            if (finished === translationResults.length) {
              resolve(translationDictionaries);
            }
          }

          for (const translationPromise of translationResults) {
            translationPromise
              .then(result => {
                addTranslationDictionary(result);
              })
              .catch(() => {
                addTranslationDictionary();
              });
          }
        });
      }
    }

    const FinalComponent = hoistStatics(
      WithTranslation,
      WrappedComponent as React.ComponentClass<any>,
    );
    return FinalComponent as React.ComponentClass<any> & C;
  };
}

function getPossibleLocales(locale: string) {
  const split = locale.split('-');
  return split.length > 1 ? [locale, split[0]] : [locale];
}

function isPromise<T>(
  possiblePromise: T | Promise<T>,
): possiblePromise is Promise<T> {
  return (possiblePromise as any).then != null;
}

function isArrayOfPromises<T>(
  possiblePromiseArray: (T | Promise<T>)[],
): possiblePromiseArray is Promise<T>[] {
  return possiblePromiseArray.some(isPromise);
}

function filterUndefined<T>(array: (T | undefined)[]): T[] {
  return array.filter(Boolean) as T[];
}
