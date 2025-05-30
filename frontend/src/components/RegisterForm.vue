<template>
  <div class="register-container">
    <div class="register-card">
      <h1 class="app-title">🧵 ThreadSpace</h1>
      <h2 class="register-title">Register</h2>
      
      <form @submit.prevent="handleRegister" class="register-form">
        <input 
          v-model="username" 
          placeholder="Username" 
          required 
          class="form-input"
        />
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
        <button type="submit" class="register-button">Register</button>
      </form>
      
      <p v-if="error" class="error-message">{{ error }}</p>
      
      <p class="login-link">
        Already registered? 
        <router-link to="/login" class="link">Login here</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import './styles/register.css'
import axios from 'axios'

export default {
  emits: ['register-success'],
  data() {
    return {
      username: '',
      email: '',
      password: '',
      error: ''
    }
  },
  methods: {
    async handleRegister() {
      try {
        await axios.post('http://localhost:3001/auth/register', {
          username: this.username,
          email: this.email,
          password: this.password
        })
        this.$router.push({ path: '/login', query: { registered: 'true' } })
      } catch (err) {
        this.error = err.response?.data?.error || 'Registration failed'
      }
    }
  }
}
</script>