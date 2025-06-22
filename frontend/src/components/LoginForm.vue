<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="app-title">🧵 ThreadSpace</h1>
      <h2 class="login-title">Login</h2>
      
      <p v-if="$route.query.registered === 'true'" class="success-message">
        You have registered successfully. Please log in.
      </p>
      
      <!-- Traditional login form -->
      <form @submit.prevent="handleLogin" class="login-form">
        <input 
          v-model="email" 
          type="email" 
          placeholder="Email" 
          required 
          class="form-input"
        />
        <input 
          v-model="password" 
          type="password" 
          placeholder="Password" 
          required 
          class="form-input"
        />
        <button type="submit" class="login-button">Login with Email</button>
      </form>
      
      <!-- Divider -->
      <div class="divider">
        <span>OR</span>
      </div>
      
      <!-- Google login button -->
      <button @click="loginWithGoogle" class="google-login-button">
        <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Login with Google
      </button>
      
      <p v-if="error" class="error-message">{{ error }}</p>
      
      <p class="register-link">
        Don't have an account? 
        <router-link to="/register" class="link">Register</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import './styles/login.css'
import axios from 'axios'
import { useAuth0 } from '@auth0/auth0-vue'

export default {
  emits: ['login-success'],
  setup() {
    const { loginWithRedirect } = useAuth0()
    return { loginWithRedirect }
  },
  data() {
    return {
      email: '',
      password: '',
      error: ''
    }
  },
  methods: {
    async handleLogin() {
      try {
        const res = await axios.post('http://localhost:3001/auth/login', {
          email: this.email,
          password: this.password
        });

        // Store token, userId, and username
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('username', res.data.username);
        localStorage.setItem('userId', res.data.userId);
        localStorage.setItem('authProvider', 'local'); // Mark as local auth

        this.$emit('login-success', res.data);
        this.$router.push('/feed');
      } catch (err) {
        console.error('Login error:', err);
        this.error = err.response?.data?.error || 'Login failed. Please check your credentials.';
      }
    },
    
    async loginWithGoogle() {
      try {
        console.log('Starting Google login...');
        // Force fresh login by adding prompt parameter
        await this.loginWithRedirect({
          authorizationParams: {
            connection: 'google-oauth2',
            prompt: 'login' // Forces Google to show login screen
          }
        });
      } catch (err) {
        console.error('Google login error:', err);
        this.error = 'Google login failed. Please try again.';
      }
    }
  }
}
</script>

<style>
/* Add these styles to your existing login.css */
.divider {
  text-align: center;
  margin: 20px 0;
  position: relative;
}

.divider span {
  padding: 0 10px;
  color: #ccc;
  font-size: 14px;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #ddd;
  z-index: -1;
}

.google-login-button {
  width: 100%;
  background: #555;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.google-login-button:hover {
  background: #777;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.google-icon {
  width: 20px;
  height: 20px;
}
</style>