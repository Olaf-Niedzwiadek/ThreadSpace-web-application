<template>
  <div class="auth-callback">
    <div class="loading-container">
      <h2>Completing login...</h2>
      <div class="spinner"></div>
      <p class="debug-info">{{ debugInfo }}</p>
    </div>
  </div>
</template>

<script>
import { useAuth0 } from '@auth0/auth0-vue'
import { useRouter } from 'vue-router'
import { onMounted, ref, watch } from 'vue'
import axios from 'axios'

export default {
  setup() {
    const { isAuthenticated, user, getAccessTokenSilently, isLoading } = useAuth0()
    const router = useRouter()
    const debugInfo = ref('Processing authentication...')
    
    const handleAuth = async () => {
      console.log('HandleAuth called:', {
        isAuthenticated: isAuthenticated.value,
        isLoading: isLoading.value,
        user: user.value
      })
      
      if (!isLoading.value && isAuthenticated.value && user.value) {
        debugInfo.value = 'Authenticated! Exchanging tokens...'
        
        try {
          // Get Auth0 access token
          const auth0Token = await getAccessTokenSilently()
          console.log('Got Auth0 token')
          
          // Exchange Auth0 token for your app's JWT token
          const response = await axios.post('http://localhost:3001/auth/auth0-login', {
            auth0Token,
            email: user.value.email,
            name: user.value.name,
            picture: user.value.picture,
            sub: user.value.sub
          })
          
          console.log('Backend response:', response.data)
          
          // Store your app's token and user info
          localStorage.setItem('token', response.data.token)
          localStorage.setItem('username', response.data.username)
          localStorage.setItem('userId', response.data.userId)
          localStorage.setItem('authProvider', 'auth0') // Make sure this line is here!
          
          console.log('Stored authProvider:', localStorage.getItem('authProvider')) // Debug log
          
          debugInfo.value = 'Success! Redirecting to feed...'
          
          // Redirect to feed
          setTimeout(() => {
            router.push('/feed')
          }, 500)
        } catch (error) {
          console.error('Auth0 login error:', error)
          debugInfo.value = `Error: ${error.message}`
          setTimeout(() => {
            router.push('/login')
          }, 2000)
        }
      }
    }
    
    // Watch for authentication state changes
    watch([isAuthenticated, isLoading, user], () => {
      if (!isLoading.value) {
        handleAuth()
      }
    })
    
    onMounted(() => {
      console.log('AuthCallback mounted')
      
      // Check for error in URL params
      const urlParams = new URLSearchParams(window.location.search)
      const error = urlParams.get('error')
      const errorDescription = urlParams.get('error_description')
      
      if (error) {
        console.error('Auth0 error:', error, errorDescription)
        debugInfo.value = `Authentication error: ${errorDescription || error}`
        setTimeout(() => {
          router.push('/login')
        }, 3000)
        return
      }
      
      // Try to handle auth immediately if already loaded
      if (!isLoading.value) {
        handleAuth()
      }
    })
    
    return {
      debugInfo
    }
  }
}
</script>

<style scoped>
.auth-callback {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.loading-container {
  text-align: center;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 20px auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.debug-info {
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}
</style>