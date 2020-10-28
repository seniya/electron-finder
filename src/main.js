import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import './plugins/helpers'
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import '@mdi/font/css/materialdesignicons.css'

Vue.config.productionTip = false

Vue.prototype.$forceCompute = function (computedName, forceUpdate /* default: true */) {
  if (this._computedWatchers[computedName]) {
    this._computedWatchers[computedName].run()
    if (forceUpdate || typeof forceUpdate === 'undefined') this.$forceUpdate()
  }
}

new Vue({
  router,
  store,
  vuetify,
  render: function (h) { return h(App) }
}).$mount('#app')
