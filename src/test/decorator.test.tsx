import {mountWithProvider} from 'tests/utilities';
import * as React from 'react';
import {ReactWrapper} from 'enzyme';
import {withI18n} from '../decorator';
import I18n from '../i18n';
import {I18nDetails, TranslationDictionary} from '../types';

function Hello({i18n}: any) {
  return <div>{i18n.translate('hello')}</div>;
}

function Goodbye({i18n}: any) {
  return <div>{i18n.translate('goodbye')}</div>;
}

const en = {hello: 'Hello', goodbye: 'Goodbye'};
const fr = {hello: 'Bonjour'};
const frCa = {hello: '’Allo'};

function createTranslationPromise(dictionary: TranslationDictionary) {
  return new Promise<TranslationDictionary>(resolve => resolve(dictionary));
}

function getTranslation(locale: string) {
  switch (locale) {
    case 'fr-ca':
      return frCa;
    case 'fr':
      return fr;
    default:
      return en;
  }
}

describe('withI18n()', () => {
  // For some reason, the I18n class we get here is different from
  // the one that decorator.tsx has.
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('provides an i18n object in props', () => {
    const I18nHello = withI18n()(Hello);
    const i18nHello = mountWithProvider(<I18nHello />);
    expect(i18nHello.find(Hello).prop('i18n')).toBeInstanceOf(I18n);
  });

  describe('translations', () => {
    it('uses a fallback when no alternative dictionaries are provided', () => {
      const I18nHello = withI18n({
        fallback: en,
      })(Hello);
      expect(content(<I18nHello />)).toBe(en.hello);
    });

    it('calls the translations() function with the full and root locale', () => {
      const translations = jest.fn().mockReturnValue(en);
      const I18nHello = withI18n({
        translations,
      })(Hello);

      mountWithProvider(<I18nHello />, {locale: 'en-US'});

      expect(translations).toHaveBeenCalledWith('en-us');
      expect(translations).toHaveBeenCalledWith('en');
    });

    it('uses provided translations when they are synchronous', () => {
      const I18nHello = withI18n({
        translations: () => en,
      })(Hello);
      expect(content(<I18nHello />)).toBe(en.hello);
    });

    it('uses a fallback when the component provides no matches for the string', () => {
      const I18nGoodbye = withI18n({
        fallback: en,
        translations: getTranslation,
      })(Goodbye);
      expect(content(<I18nGoodbye />, {locale: 'fr-ca'})).toBe(en.goodbye);
    });

    it('prefers a provided translation to the fallback', () => {
      const I18nHello = withI18n({
        translations: getTranslation,
      })(Hello);
      expect(content(<I18nHello />, {locale: 'fr'})).toBe(fr.hello);
    });

    it('prefers the most specific translation', () => {
      const I18nHello = withI18n({
        translations: getTranslation,
      })(Hello);
      expect(content(<I18nHello />, {locale: 'fr-ca'})).toBe(frCa.hello);
    });

    it('uses the fallback while loading asynchronous dictionaries', async () => {
      const promise = createTranslationPromise(fr);

      const I18nHello = withI18n({
        fallback: en,
        translations: () => promise,
      })(Hello);

      const hello = mountWithProvider(<I18nHello />, {locale: 'fr'});

      expect(contentFromWrapper(hello)).toBe(en.hello);
      await resolveDictionaryPromise(hello, promise);
      expect(contentFromWrapper(hello)).toBe(fr.hello);
    });
  });

  describe('displayName', () => {
    it('uses component’s name when no displayName exists', () => {
      const I18nHello = withI18n()(Hello);
      expect(I18nHello.displayName).toContain(Hello.name);
    });

    it('uses component’s displayName when no options isProvided', () => {
      const displayName = 'FooBar';
      const I18nHello = withI18n()(
        // eslint-disable-next-line react/prefer-stateless-function
        class MyComponent extends React.Component<never, never> {
          static displayName = displayName;

          render() {
            return null;
          }
        },
      );
      expect(I18nHello.displayName).toContain(displayName);
    });

    it('uses a displayName provided in the options argument', () => {
      const displayName = 'FooBar';
      const I18nHello = withI18n({displayName})(Hello);
      expect(I18nHello.displayName).toContain(displayName);
    });
  });
});

function content(element: React.ReactElement<any>, details?: I18nDetails) {
  return contentFromWrapper(mountWithProvider(element, details));
}

function contentFromWrapper(wrapper: ReactWrapper) {
  return wrapper
    .children()
    .at(0)
    .text();
}

async function resolveDictionaryPromise(
  wrapper: ReactWrapper,
  promise: Promise<any>,
) {
  await promise;
  await new Promise(resolve => process.nextTick(resolve));
}
