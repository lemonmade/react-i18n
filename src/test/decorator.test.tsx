jest.mock('../connection', () => ({
  default: jest.fn(function Connection(this: any) {
    this.extend = jest.fn();
  }),
}));

jest.mock('../manager', () => ({
  default: jest.fn(function Manager(this: any) {
    this.connect = jest.fn();
    this.state = jest.fn(() => ({loading: false, translations: []}));
    this.details = {locale: 'en-ca'};
  }),
}));

jest.mock('../i18n', () => ({
  default: jest.fn(),
}));

import * as React from 'react';
import * as PropTypes from 'prop-types';
import {mount} from 'enzyme';

import {withI18n} from '../decorator';

const I18n: jest.Mock = require.requireMock('../i18n').default;

const Connection: jest.Mock<{extend: jest.Mock}> = require.requireMock(
  '../connection',
).default;

const Manager: jest.Mock<{
  connect: jest.Mock;
  state: jest.Mock;
  details: object;
}> = require.requireMock('../manager').default;

function MyComponent() {
  return null;
}

const en = {hello: 'Hello'};
const fr = {hello: 'Bonjour'};

describe('withI18n()', () => {
  beforeEach(() => {
    Connection.mockClear();
    Manager.mockClear();
    I18n.mockClear();
  });

  it('throws an error when there is no parent connection and no translations', () => {
    const I18nComponent = withI18n()(MyComponent);
    expect(() => mountWithManager(<I18nComponent />)).toThrowError();
  });

  it('connects to the manager with provided translations and fallback', () => {
    const options = {
      id: 'MyComponent',
      fallback: en,
      translations: jest.fn(),
    };

    const manager = new Manager();
    const I18nComponent = withI18n(options)(MyComponent);
    mountWithManager(<I18nComponent />, manager);

    expect(Connection).toHaveBeenCalledWith(options);
    expect(manager.connect).toHaveBeenCalledWith(
      Connection.mock.instances[0],
      expect.any(Function),
    );
  });

  it('conects to the manager with an extended connection provided by a parent', () => {
    const options = {
      id: 'MyComponent',
      fallback: en,
      translations: jest.fn(),
    };

    const manager = new Manager();
    const parentConnection = new Connection();
    const connection = new Connection();
    parentConnection.extend.mockReturnValue(connection);

    const I18nComponent = withI18n(options)(MyComponent);
    mountWithManager(<I18nComponent />, manager, parentConnection);

    expect(parentConnection.extend).toHaveBeenCalledWith(options);
    expect(manager.connect).toHaveBeenCalledWith(
      connection,
      expect.any(Function),
    );
  });

  it('uses a parent connection directly when no custom translations are provided', () => {
    const manager = new Manager();
    const parentConnection = new Connection();

    const I18nComponent = withI18n()(MyComponent);
    mountWithManager(<I18nComponent />, manager, parentConnection);

    expect(Connection).toHaveBeenCalledTimes(1);
    expect(parentConnection.extend).not.toHaveBeenCalled();
    expect(manager.connect).toHaveBeenCalledWith(
      parentConnection,
      expect.any(Function),
    );
  });

  it('uses the translations from initial state', () => {
    const manager = new Manager();
    manager.state.mockReturnValue({translations: [en], loading: false});

    const I18nComponent = withI18n({fallback: en})(MyComponent);
    const i18nComponent = mountWithManager(<I18nComponent />, manager);

    expect(I18n).toHaveBeenCalledTimes(1);
    expect(I18n).toHaveBeenCalledWith([en], manager.details);
    expect(i18nComponent.find(MyComponent).prop('i18n')).toBe(
      I18n.mock.instances[0],
    );
  });

  it('responds to an update in the connection by updating the i18n object', () => {
    const manager = new Manager();

    const I18nComponent = withI18n({fallback: en})(MyComponent);
    const i18nComponent = mountWithManager(<I18nComponent />, manager);

    const subscription = manager.connect.mock.calls[0][1];
    expect(subscription).toBeInstanceOf(Function);
    expect(I18n).toHaveBeenCalledTimes(1);

    subscription({translations: [fr], loading: false});
    i18nComponent.update();

    expect(I18n).toHaveBeenCalledTimes(2);
    expect(I18n).toHaveBeenLastCalledWith([fr], manager.details);
    expect(i18nComponent.find(MyComponent).prop('i18n')).toBe(
      I18n.mock.instances[1],
    );
  });

  it('disconnects from the manager on unmount', () => {
    const manager = new Manager();
    const connectionManager = {disconnect: jest.fn()};
    manager.connect.mockReturnValue(connectionManager);

    const I18nComponent = withI18n({fallback: en})(MyComponent);
    const i18nComponent = mountWithManager(<I18nComponent />, manager);

    expect(connectionManager.disconnect).not.toHaveBeenCalled();
    i18nComponent.unmount();
    expect(connectionManager.disconnect).toHaveBeenCalled();
  });
});

function mountWithManager(
  component: React.ReactElement<any>,
  manager = new Manager(),
  parentConnection?: any,
) {
  return mount(component, {
    context: {i18nManager: manager, i18nConnection: parentConnection},
    childContextTypes: {
      i18nManager: PropTypes.any,
      i18nConnection: PropTypes.any,
    },
  });
}
