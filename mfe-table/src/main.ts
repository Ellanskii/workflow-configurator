import { createPinia } from 'pinia';
import singleSpaVue from 'single-spa-vue';
import { createApp, h } from 'vue';

import App from './App.vue';
import './assets/styles/global.scss';

interface VueCustomProps {
  domElement?: HTMLElement;
}

const vueLifecycles = singleSpaVue({
  createApp,
  appOptions: async (_opts, props: VueCustomProps = {}) => ({
    el: props.domElement,
    render() {
      return h(App);
    },
  }),
  handleInstance(app) {
    app.use(createPinia());
  },
});

export const bootstrap = vueLifecycles.bootstrap;
export const mount = vueLifecycles.mount;
export const unmount = vueLifecycles.unmount;
