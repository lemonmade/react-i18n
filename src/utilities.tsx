import * as React from 'react';
import {
  TranslationDictionary,
  ComplexReplacementDictionary,
  PrimitiveReplacementDictionary,
} from './types';

const REPLACE_REGEX = /{([^}]*)}/g;
const REPLACE_FINDER = /([^{]*)({([^}]*)})?/g;

export function translate(
  id: string,
  translations: TranslationDictionary[],
  replacements?: PrimitiveReplacementDictionary,
): string;
export function translate(
  id: string,
  translations: TranslationDictionary[],
  replacements?: ComplexReplacementDictionary,
): React.ReactElement<any>;
export function translate(
  id: string,
  translations: TranslationDictionary[],
  replacements?: any,
): any {
  for (const translationDictionary of translations) {
    const result = translateWithDictionary(
      id,
      translationDictionary,
      replacements,
    );

    if (result) {
      return result;
    }
  }

  return '';
}

export function translateWithDictionary(
  id: string,
  translations: TranslationDictionary,
  replacements?: PrimitiveReplacementDictionary,
): string;
export function translateWithDictionary(
  id: string,
  translations: TranslationDictionary,
  replacements?: ComplexReplacementDictionary,
): React.ReactElement<any>;
export function translateWithDictionary(
  id: string,
  translations: TranslationDictionary,
  replacements?: any,
): any {
  let result: string | TranslationDictionary = translations;

  for (const part of id.split('.')) {
    if (result == null || typeof result !== 'object') {
      return '';
    }

    result = result[part];
  }

  if (typeof result === 'string') {
    if (replacements == null) {
      return result;
    }

    return updateStringWithReplacements(result, replacements);
  } else {
    return '';
  }
}

function updateStringWithReplacements(
  str: string,
  replacements: ComplexReplacementDictionary,
): React.ReactElement<any>;
function updateStringWithReplacements(
  str: string,
  replacements: PrimitiveReplacementDictionary,
): string;
function updateStringWithReplacements(str: string, replacements: any): any {
  const allReplacementsArePrimitives = Object.keys(replacements).every(
    key => typeof replacements[key] !== 'object',
  );

  if (allReplacementsArePrimitives) {
    return str.replace(REPLACE_REGEX, match => {
      const replacement = match.substring(1, match.length - 1);

      if (!replacements.hasOwnProperty(replacement)) {
        throw new Error(
          `No replacement found for key '${replacement}'. The following replacements were passed: ${Object.keys(
            replacements,
          )
            .map(key => `'${key}'`)
            .join(', ')}`,
        );
      }

      return replacements[replacement] as string;
    });
  } else {
    const pieces: (string | React.ReactElement<any>)[] = [];

    let match = REPLACE_FINDER.exec(str);
    let matchIndex = 0;

    while (match) {
      const regularText = match[1];
      const replacement = match[3];

      if (match.index >= str.length) {
        break;
      }

      if (regularText) {
        pieces.push(regularText);
      }

      if (replacement) {
        if (!replacements.hasOwnProperty(replacement)) {
          throw new Error(
            `No replacement found for key '${replacement}'. The following replacements were passed: ${Object.keys(
              replacements,
            )
              .map(key => `'${key}'`)
              .join(', ')}`,
          );
        }

        matchIndex += 1;
        const finalReplacement = React.isValidElement(replacements[replacement])
          ? React.cloneElement(
              replacements[replacement] as React.ReactElement<any>,
              {key: matchIndex},
            )
          : (replacements[replacement] as string);

        pieces.push(finalReplacement);
      }

      match = REPLACE_FINDER.exec(str);
    }

    REPLACE_FINDER.lastIndex = 0;

    return <span>{pieces}</span>;
  }
}

export function noop() {}
