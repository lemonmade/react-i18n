export function countryCodeFromLocale(locale: string): string | undefined {
  const code = locale.split('-')[1];
  return code && code.toUpperCase();
}

export function languageFromLocale(locale: string) {
  return locale.split('-')[0].toLowerCase();
}

export function normalizeLocale(locale: string) {
  return locale.includes('-')
    ? `${languageFromLocale(locale)}-${countryCodeFromLocale(locale)}`
    : languageFromLocale(locale);
}

export function noop() {}
