import { ComputedRef, computed, reactive } from "vue";
import { Module } from "./module/module";
import {
  Action,
  ActionContext,
  Getter,
  Mutation,
  Store,
  WrappedGetter,
} from "./store";
import { foreachValue, isPromise, partial } from "./util";

export function installModule<S extends Record<string, any>>(
  store: Store<S>,
  rootState: S,
  path: string[],
  module: Module<any, S>
) {
  const isRoot = path.length === 0;
  const namespace = store._modules.getNameSpace(path);

  if (!isRoot) {
    const parentState = getNestedState(rootState, path.slice(0, -1));
    const moduleName = path[path.length - 1];

    store._withCommit(() => {
      if (moduleName in parentState) {
        console.warn(
          `[vuex] state field "${moduleName}" was overridden by a module with the same name at "${path.join(
            "."
          )}"`
        );
      }
      (parentState as any)[moduleName] = module.state;
    });
  }

  const local = (module.context = makeLocalContext(store, namespace, path));

  module.foreachMutation((mutation, key) => {
    const namespacedType = namespace + key;
    registerMutation(store, namespacedType, mutation, local);
  });

  module.foreachAction((action, key) => {
    const namespacedType = namespace + key;
    registerAction(store, namespacedType, action, local);
  });

  module.foreachGetter((getter, key) => {
    const namespacedType = namespace + key;
    registerGetter(store, namespacedType, getter, local);
  });

  module.foreachChild((child, key) => {
    installModule(store, rootState, path.concat(key), child);
  });
}

function getNestedState<S extends Record<string, any>>(
  state: S,
  path: string[]
) {
  return path.reduce((state, key) => state[key], state);
}

function registerMutation<S extends Record<string, any>>(
  store: Store<S>,
  type: string,
  handler: Mutation<S>,
  local: ActionContext<any, S>
) {
  const entry = store._mutations[type] || (store._mutations[type] = []);
  entry.push((payload: any) => {
    handler.call(store, local.state, payload);
  });
}

function registerAction<S extends Record<string, any>>(
  store: Store<S>,
  type: string,
  handler: Action<any, S>,
  local: ActionContext<any, S>
) {
  const entry = store._actions[type] || (store._actions[type] = []);
  entry.push((payload: any) => {
    let res = handler.call(
      store,
      {
        dispatch: local.dispatch,
        commit: local.commit,
        state: local.state,
      },
      payload
    );
    if (!isPromise(res)) {
      res = Promise.resolve(res);
    }
    return res;
  });
}

function registerGetter<S extends Record<string, any>>(
  store: Store<S>,
  type: string,
  rawGetter: Getter<any, S>,
  local: ActionContext<any, S>
) {
  if (store._wrappedGetters[type]) {
    console.error(`[vuex] duplicate getter key: ${type}`);
    return;
  }
  store._wrappedGetters[type] = function wrappedGetter(store: Store<S>) {
    return rawGetter(local.state);
  } as WrappedGetter;
}

function makeLocalContext<S extends Record<string, any>>(
  store: Store<S>,
  namespace: string,
  path: string[]
) {
  const noNamespace = namespace === "";
  const local = {
    dispatch: noNamespace
      ? store.dispatch
      : (type: string, payload: any) => {
          return store.dispatch(namespace + type, payload);
        },
    commit: noNamespace
      ? store.commit
      : (type: string, payload: any) => {
          return store.commit(namespace + type, payload);
        },

    state: {},
  };

  Object.defineProperties(local, {
    state: {
      get: () => getNestedState(store.state, path),
    },
  });

  return local;
}

export function resetStoreState<S extends Record<string, any>>(
  store: Store<S>,
  state: S
) {
  const wrappedGetters = store._wrappedGetters;
  const computedObj: Record<string, any> = {};
  const computedCache: Record<string, ComputedRef<any>> = {};

  store._state = reactive({ data: state });

  foreachValue(wrappedGetters, (fn, key) => {
    computedObj[key] = partial(fn, store);
    computedCache[key] = computed(() => computedObj[key]());
    Object.defineProperty(store.getters, key, {
      get: () => computedCache[key].value,
      enumerable: true,
    });
  });
}
