import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
    components,
    directives,
    defaults: {
        global: {
            font: {
                family: "'Plus Jakarta Sans', system-ui, sans-serif",
            },
        },
    },
    theme: {
        defaultTheme: 'light',
        themes: {
            light: {
                dark: false,
                colors: {
                    primary: '#5D87FF', // MaterialM Blue
                    secondary: '#49BEFF', // MaterialM Cyan
                    accent: '#8b5cf6',
                    error: '#FA896B',
                    info: '#539BFF',
                    success: '#13DEB9',
                    warning: '#FFAE1F',
                    background: '#f5f5f5',
                    surface: '#ffffff',
                }
            },
        },
    },
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: {
            mdi,
        },
    },
})

createApp(App).use(vuetify).mount('#app')
