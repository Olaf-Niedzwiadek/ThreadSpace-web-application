<template>
  <div id="app" v-if="!isLoading">
    <router-view />
  </div>
  <div v-else class="loading-app">
    <div class="spinner"></div>
    <p>Initializing...</p>
  </div>
</template>

<script>
import { useAuth0 } from '@auth0/auth0-vue'

export default {
  name: 'App',
  setup() {
    const { isLoading, error } = useAuth0()
    
    if (error.value) {
      console.error('Auth0 initialization error:', error.value)
    }
    
    return { isLoading }
  }
}
</script>

<style>
/* Your existing styles */
body {
  margin: 0;
  background-color: #1e1e1e;
  color: #fff;
  font-family: Arial, sans-serif;
}

/* Loading screen styles */
.loading-app {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #1e1e1e;
  color: #fff;
}

.loading-app p {
  margin-top: 20px;
  font-size: 18px;
  color: #888;
}

.spinner {
  border: 3px solid #333;
  border-top: 3px solid #fff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>