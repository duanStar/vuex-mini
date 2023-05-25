import { Store, StoreOptions } from "./store";

export function createStore<S extends Record<string, any>>(
  options: StoreOptions<S>
) {
  return new Store<S>(options);
}
