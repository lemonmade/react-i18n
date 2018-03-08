import {mount} from 'enzyme';
import {ReactElement} from 'react';
import * as PropTypes from 'prop-types';
import {I18nManager, I18nDetails} from '../src';

export function mountWithProvider<T>(
  element: ReactElement<T>,
  details?: I18nDetails,
) {
  const i18nManager = new I18nManager({locale: 'en-us', ...details});
  return mount(element, {
    context: {i18nManager},
    childContextTypes: {i18nManager: PropTypes.any},
  });
}
