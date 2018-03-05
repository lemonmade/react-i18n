import {I18nDetails} from './types';

export interface Subscriber {
  (i18nDetails: I18nDetails): void;
}

export interface Subscription {
  unsubscribe(): void;
}

export default class I18nStore {
  protected parent?: I18nStore;
  private subscriptions = new Set<Subscriber>();
  private children = new Set<I18nStore>();

  constructor(public details: I18nDetails) {}

  addChild(manager: I18nStore) {
    if (manager.parent) {
      manager.parent.removeChild(manager);
    }

    manager.parent = this;
    this.children.add(manager);
  }

  removeChild(manager: I18nStore) {
    if (manager.parent !== this) {
      return;
    }

    manager.parent = undefined;
    this.children.delete(manager);
  }

  subscribe(subscription: Subscriber): Subscription {
    this.subscriptions.add(subscription);

    return {
      unsubscribe: () => this.subscriptions.delete(subscription),
    };
  }

  update(details: I18nDetails) {
    this.details = details;

    for (const subscription of this.subscriptions) {
      subscription(details);
    }

    for (const child of this.children) {
      child.update(details);
    }
  }
}
