import {
  Action,
  ActionContext,
  Module as ModuleOptions,
  Mutation,
} from "../store";
import { foreachValue } from "../util";

export class Module<
  S extends Record<string, any>,
  R extends Record<string, any>
> {
  private _children: Record<string, Module<any, R>> = Object.create(null);
  private _rawModule: ModuleOptions<S, R>;
  state: S;
  context?: ActionContext<S, R>;
  constructor(rawModule: ModuleOptions<S, R>) {
    this._rawModule = rawModule;
    const rawState = rawModule.state;
    this.state =
      typeof rawState === "function"
        ? (rawState as () => S)()
        : rawState || Object.create(null);
  }

  addChild(key: string, module: Module<any, R>) {
    this._children[key] = module;
  }

  removeChild(key: string) {
    delete this._children[key];
  }

  getChild(key: string) {
    return this._children[key];
  }

  hasChild(key: string) {
    return key in this._children;
  }

  get namespaced() {
    return !!this._rawModule.namespaced;
  }

  foreachMutation(fn: (mutation: Mutation<S>, key: string) => void) {
    if (this._rawModule.mutations) {
      foreachValue(this._rawModule.mutations, fn);
    }
  }

  foreachAction(fn: (action: Action<S, R>, key: string) => void) {
    if (this._rawModule.actions) {
      foreachValue(this._rawModule.actions, fn);
    }
  }

  foreachGetter(fn: (getter: any, key: string) => void) {
    if (this._rawModule.getters) {
      foreachValue(this._rawModule.getters, fn);
    }
  }

  foreachChild(fn: (module: Module<any, R>, key: string) => void) {
    foreachValue(this._children, fn);
  }
}
