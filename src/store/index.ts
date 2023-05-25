import { createStore } from "../vuex";

export interface RootState {
  count: number;
}

const store = createStore<RootState>({
  modules: {
    a: {
      namespaced: true,
      state: {
        count: 1,
      },
      mutations: {
        increment(state) {
          state.count++;
        },
      },
      getters: {
        double(state) {
          return state.count * 2;
        },
      },
    },
    b: {
      namespaced: true,
      state: {
        count: 2,
      },
      mutations: {
        increment(state) {
          state.count++;
        },
      },
    },
  },
  state: {
    count: 0,
  },
  getters: {
    double(state) {
      return state.count * 2;
    },
  },
  mutations: {
    increment(state) {
      state.count++;
    },
  },
  actions: {
    increment(context) {
      setTimeout(() => {
        context.commit("increment");
      }, 1000);
    },
  },
});

export default store;
