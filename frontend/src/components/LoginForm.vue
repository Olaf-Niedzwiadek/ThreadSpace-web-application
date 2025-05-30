<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="app-title">🧵 ThreadSpace</h1>
      <h2 class="login-title">Login</h2>
      
      <p v-if="$route.query.registered === 'true'" class="success-message">
        You have registered successfully. Please log in.
      </p>
      
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
        <button type="submit" class="login-button">Login</button>
      </form>
      
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

export default {
  emits: ['login-success'],
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
        })
        this.$emit('login-success', res.data)
        localStorage.setItem('username', res.data.username)
        localStorage.setItem('userId', res.data.userId)
        this.$router.push('/feed')
      } catch (err) {
        this.error = err.response?.data?.error || 'Login failed'
      }
    }
  }
}
</script>
