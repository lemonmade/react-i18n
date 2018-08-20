import * as React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {
  withI18n,
  WithI18nProps,
  Provider,
  Manager,
  getTranslationsFromTree,
  localeMap,
} from '..';

const fallbackTranslations = {MyComponent: {hello: 'Hello'}};
const frTranslations = {MyComponent: {hello: 'Bonjour'}};
const frCATranslations = {MyComponent: {hello: 'Allo Bonjour'}};

function MyComponent({
  i18n,
  children,
}: WithI18nProps & {children?: React.ReactNode}) {
  return (
    <div>
      {i18n.translate('MyComponent.hello')}
      {children}
    </div>
  );
}

const WithI18nComponent = withI18n({
  id: 'MyComponent',
  fallback: fallbackTranslations,
  translations: localeMap({
    fr: frTranslations,
    'fr-ca': frCATranslations,
  }),
})(MyComponent);

const WithAsyncI18nComponent = withI18n({
  id: 'MyComponent',
  fallback: fallbackTranslations,
  translations: localeMap({
    fr: () => defer(frTranslations),
    'fr-ca': () => defer(frCATranslations),
  }),
})(MyComponent);

const WithoutOwnI18nComponent = withI18n()(MyComponent);

describe('server', () => {
  it('allows for synchronously rendering', () => {
    const manager = new Manager({locale: 'fr-ca'});
    const markup = renderToStaticMarkup(
      <Provider manager={manager}>
        <WithI18nComponent />
      </Provider>,
    );
    expect(markup).toBe(`<div>${frCATranslations.MyComponent.hello}</div>`);
  });

  it('extracts async translations', async () => {
    const manager = new Manager({locale: 'fr-ca'});
    const element = (
      <Provider manager={manager}>
        <WithAsyncI18nComponent />
      </Provider>
    );

    const translations = await getTranslationsFromTree(element);
    const markup = renderToStaticMarkup(element);

    expect(markup).toBe(`<div>${frCATranslations.MyComponent.hello}</div>`);

    const extractedTranslations = Object.values(translations);
    expect(Object.keys(translations)).toBeArrayOfUniqueItems();
    expect(extractedTranslations).toContain(frCATranslations);
    expect(extractedTranslations).toContain(frTranslations);
  });

  it('only loads the minimum subset of translations for the locale', async () => {
    const manager = new Manager({locale: 'fr'});
    const element = (
      <Provider manager={manager}>
        <WithAsyncI18nComponent />
      </Provider>
    );

    const translations = await getTranslationsFromTree(element);
    const markup = renderToStaticMarkup(element);

    expect(markup).toBe(`<div>${frTranslations.MyComponent.hello}</div>`);

    const extractedTranslations = Object.values(translations);
    expect(Object.keys(translations)).toBeArrayOfUniqueItems();
    expect(extractedTranslations).toContain(frTranslations);
    expect(extractedTranslations).not.toContain(frCATranslations);
  });

  it('handles nested translation connections', async () => {
    const manager = new Manager({locale: 'fr'});
    const element = (
      <Provider manager={manager}>
        <WithAsyncI18nComponent>
          <WithoutOwnI18nComponent />
        </WithAsyncI18nComponent>
      </Provider>
    );

    await getTranslationsFromTree(element);
    const markup = renderToStaticMarkup(element);

    expect(markup).toBe(
      `<div>${frTranslations.MyComponent.hello}<div>${
        frTranslations.MyComponent.hello
      }</div></div>`,
    );
  });
});

function defer<T>(value: T): Promise<T> {
  return new Promise(resolve => {
    setTimeout(resolve.bind(null, value), 1);
  });
}
