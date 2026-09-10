import { createApp } from 'vue'
import './base'
import App from './App.vue'
import { entries, site } from 'virtual:content'

createApp(App, { entries, site }).mount('#app')
