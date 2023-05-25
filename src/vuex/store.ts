import { App, UnwrapNestedRefs, inject, reactive } from "vue";
import { ModuleCollection } from "./module/module-collection";
import { installModule, resetStoreState } from "./store-util";

export const injectKey = "store";

export function useStore<S extends Record<string, any>>(): Store<S> {
  const store = inject(injectKey) as Store<S>;
  if (!store) {
    throw new Error("No store provided.");
  }
  return store;
}

export type WrappedGetter = <S extends Record<string, any>>(
  store: Store<S>
) => any;

export type Subscriber = (mutation: MutationPayload, state: any) => void;

export interface MutationPayload {
  type: string;
  payload?: any;
}

export class Store<S extends Record<string, any>> {
  _committing = false;
  _actions: ActionsTree<S, S>;
  _mutations: MutationsTree<S>;
  _modules: ModuleCollection<S>;
  _wrappedGetters: Record<string, WrappedGetter>;
  _state: UnwrapNestedRefs<{
    data: S;
  }> = reactive({
    data: {} as S,
  });
  _subscribers: Subscriber[] = [];
  getters: Record<string, any> = {};
  constructor(options: StoreOptions<S>) {
    const store = this;
    const { dispatch, commit } = this;

    this._mutations = Object.create(null);
    this._actions = Object.create(null);
    this._wrappedGetters = Object.create(null);
    this._modules = new ModuleCollection(options);

    const state = this._modules.root.state;

    this.dispatch = function boundDispatch(type: string, payload?: any) {
      return dispatch.call(store, type, payload);
    };
    this.commit = function boundCommit(type: string, payload?: any) {
      return commit.call(store, type, payload);
    };

    installModule(store, state, [], this._modules.root);

    resetStoreState(store, state);
  }

  get state() {
    return reactive(this._state.data);
  }

  set state(_v) {
    console.error(`use store.replaceState() to explicit replace store state.`);
  }

  install(app: App) {
    app.provide(injectKey, this);
    app.config.globalProperties.$store = this;
  }

  commit(type: string, payload?: any) {
    const mutation = { type, payload };
    const entry = this._mutations[type];

    if (!entry) {
      console.error(`[vuex] unknown mutation type: ${type}`);
      return;
    }

    this._withCommit(() => {
      entry.forEach((handler) => {
        handler(payload);
      });
    });

    this._subscribers.forEach((sub) => sub(mutation, this.state));
  }

  dispatch(type: string, payload?: any) {
    const action = { type, payload };
    const entry = this._actions[type];

    if (!entry) {
      console.error(`[vuex] unknown mutation type: ${type}`);
      return;
    }

    entry.length > 1
      ? Promise.all(entry.map((handler) => handler(payload)))
      : entry[0](payload);
  }

  _withCommit(fn: () => void) {
    this._committing = true;
    fn();
    this._committing = false;
  }

  subscribe(fn: Subscriber) {
    this._subscribers.push(fn);
  }
}

export interface StoreOptions<S extends Record<string, any>> {
  state?: S | (() => S);
  getters?: GetterTree<S, S>;
  mutations?: MutationTree<S>;
  actions?: ActionTree<S, S>;
  modules: ModuleTree<S>;
}

export interface GetterTree<
  S extends Record<string, any>,
  R extends Record<string, any>
> {
  [key: string]: Getter<S, R>;
}
export type Getter<
  S extends Record<string, any>,
  R extends Record<string, any>
> = (state: S) => any;

export interface MutationTree<S extends Record<string, any>> {
  [key: string]: Mutation<S>;
}
export type Mutation<S extends Record<string, any>> = (
  state: S,
  payload?: any
) => any;

export interface MutationsTree<S extends Record<string, any>> {
  [key: string]: Mutation<S>[];
}

export interface ActionTree<
  S extends Record<string, any>,
  R extends Record<string, any>
> {
  [key: string]: Action<S, R>;
}
export interface ActionsTree<
  S extends Record<string, any>,
  R extends Record<string, any>
> {
  [key: string]: Action<S, R>[];
}

export type Action<
  S extends Record<string, any>,
  R extends Record<string, any>
> = (context: ActionContext<S, R>, payload?: any) => any;

export interface ActionContext<
  S extends Record<string, any>,
  R extends Record<string, any>
> {
  dispatch: Dispatch;
  commit: Commit;
  state: S;
}

export type Dispatch = (type: string, payload?: any) => any;
export type Commit = (type: string, payload?: any) => any;

export interface ModuleTree<R extends Record<string, any>> {
  [key: string]: Module<any, R>;
}

export interface Module<
  S extends Record<string, any>,
  R extends Record<string, any>
> {
  state?: S | (() => S);
  getters?: GetterTree<S, R>;
  mutations?: MutationTree<S>;
  actions?: ActionTree<S, R>;
  modules?: ModuleTree<R>;
  namespaced?: boolean;
}
