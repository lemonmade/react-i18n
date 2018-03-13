import * as React from 'react';
import {translate} from '../utilities';
import {MissingTranslationError, MissingReplacementError} from '../errors';

const locale = 'en-us';

describe('translate()', () => {
  it('throws a MissingTranslationError when no translation is found', () => {
    expect(() => translate('foo', {}, locale)).toThrowError(
      MissingTranslationError,
    );
  });

  it('looks up a translation by key', () => {
    expect(translate('foo', {foo: 'bar'}, locale)).toBe('bar');
  });

  it('looks up a translation by nested key', () => {
    expect(translate('foo.bar', {foo: {bar: 'baz'}}, locale)).toBe('baz');
  });

  it('looks through an array of translation dictionaries', () => {
    const dictionaries: any[] = [{foo: {baz: 'one'}}, {foo: {bar: 'two'}}];
    expect(translate('foo.bar', dictionaries, locale)).toBe('two');
  });

  it('uses the first dictionary in order that has a translation', () => {
    const dictionaries: any[] = [{foo: {bar: 'one'}}, {foo: {bar: 'two'}}];
    expect(translate('foo.bar', dictionaries, locale)).toBe('one');
  });

  describe('replacements', () => {
    it('performs replacements with strings', () => {
      expect(translate('foo', {foo: 'bar: {bar}'}, locale, {bar: 'true'})).toBe(
        'bar: true',
      );
    });

    it('performs replacements with JSX by creating an array and cloning elements with unique keys', () => {
      function CustomComponent() {
        return null;
      }

      const bar = <div>Content</div>;
      const baz = <CustomComponent />;
      const translated = translate('foo', {foo: '{bar} {baz} '}, locale, {
        bar,
        baz,
      });

      expect(translated).toBeInstanceOf(Array);
      expect(translated).toHaveLength(4);
      expect(translated).toMatchObject([
        React.cloneElement(bar, {key: 1}),
        ' ',
        React.cloneElement(baz, {key: 2}),
        ' ',
      ]);
    });

    it('uses the pluralization rules of the provided locale when a replacement named `count` is passed', () => {
      const dictionary = {foo: {one: '{count} foo', other: '{count} foos'}};
      expect(translate('foo', dictionary, locale, {count: 1})).toBe('1 foo');
      expect(translate('foo', dictionary, locale, {count: 2})).toBe('2 foos');
    });

    it('throws a MissingReplacementError when there is a missing replacement', () => {
      expect(() => translate('foo', {foo: 'bar: {bar}'}, locale)).toThrowError(
        MissingReplacementError,
      );
    });
  });
});
