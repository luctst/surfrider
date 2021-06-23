import Vue from 'vue';
import VCalendar from 'v-calendar';
import App from './App.vue';
import './registerServiceWorker';

Vue.config.productionTip = false;
Vue.use(VCalendar, {
  componentPrefix: 'vc',
});

new Vue({
  render: (h) => h(App),
}).$mount('#app');
