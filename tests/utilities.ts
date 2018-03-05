import {mount} from 'enzyme';
import {ReactElement} from 'react';
import * as PropTypes from 'prop-types';
import {I18nStore, I18nDetails} from '../src';

export function mountWithProvider<T>(
  element: ReactElement<T>,
  details?: I18nDetails,
) {
  const i18nStore = new I18nStore({locale: 'en-us', ...details});
  return mount(element, {
    context: {i18nStore},
    childContextTypes: {i18nStore: PropTypes.any},
  });
}
