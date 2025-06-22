// src/main.js
import { createApp } from 'vue'
import { createAuth0 } from '@auth0/auth0-vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

// Auth0 configuration
const auth0 = createAuth0({
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  authorizationParams: {
    redirect_uri: `${window.location.origin}/auth/callback`,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE
  },
  cacheLocation: 'localstorage',
  useRefreshTokens: true
})

// IMPORTANT: Auth0 must be initialized before router
app.use(auth0)
app.use(router)
app.mount('#app')

// Log Auth0 configuration for debugging
console.log('Auth0 Configuration:', {
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  redirectUri: `${window.location.origin}/auth/callback`,
  audience: import.meta.env.VITE_AUTH0_AUDIENCE
})