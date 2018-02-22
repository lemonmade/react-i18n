import * as React from 'react';
import * as PropTypes from 'prop-types';

import I18nStore from './store';

export const contextTypes = {
  i18nStore: PropTypes.instanceOf(I18nStore),
};

export interface Context {
  i18nStore: I18nStore;
}

export interface Props {
  i18nStore: I18nStore;
}

export default class Provider extends React.PureComponent<Props, never> {
  static childContextTypes = contextTypes;

  getChildContext(): Context {
    return {i18nStore: this.props.i18nStore};
  }

  render() {
    return this.props.children;
  }
}
