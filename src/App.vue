<script setup lang="ts">
import HelloWorld from "./components/HelloWorld.vue";
import { RootState } from "./store";
import { useStore } from "./vuex/store";
const store = useStore<RootState>();
console.log("🚀 ~ file: App.vue:6 ~ store:", store);
store.subscribe((mutation, state) => {
  console.log("🚀 ~ file: App.vue:8 ~ mutation, state", mutation, state);
});
</script>

<template>
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
  <HelloWorld msg="Vite + Vue" />
  <span @click="store.dispatch('a/increment')">{{
    store.getters["a/double"]
  }}</span>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
