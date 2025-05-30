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

<style scoped>
/* Full page container with dark theme */
.register-container {
  background-color: #1e1e1e;
  color: #ffffff;
  min-height: 100vh;
  font-family: Arial, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  box-sizing: border-box;
}

/* Main register card */
.register-card {
  background: #2b2b2b;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 420px;
  text-align: center;
  border: 1px solid #444;
}

/* App title styling */
.app-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: #fff;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* Register subtitle */
.register-title {
  font-size: 1.8rem;
  color: #d1bfff;
  margin-bottom: 2rem;
  font-weight: 600;
}

/* Form container */
.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

/* Input fields */
.form-input {
  background: #383838;
  border: 2px solid #555;
  color: #ffffff;
  padding: 1rem;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  outline: none;
}

.form-input::placeholder {
  color: #aaa;
}

.form-input:focus {
  border-color: #d1bfff;
  background: #404040;
  box-shadow: 0 0 0 3px rgba(209, 191, 255, 0.1);
}

.form-input:hover {
  border-color: #666;
}

/* Register button */
.register-button {
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

.register-button:hover {
  background: #777;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.register-button:active {
  transform: translateY(0);
}

/* Error message */
.error-message {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

/* Login link */
.login-link {
  color: #ccc;
  font-size: 0.95rem;
  margin-top: 1rem;
}

.link {
  color: #d1bfff;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.link:hover {
  color: #fff;
  text-decoration: underline;
}

/* Responsive design */
@media (max-width: 480px) {
  .register-container {
    padding: 1rem;
  }
  
  .register-card {
    padding: 2rem;
  }
  
  .app-title {
    font-size: 2rem;
  }
  
  .register-title {
    font-size: 1.5rem;
  }
}

/* Loading state for button (optional enhancement) */
.register-button:disabled {
  background: #444;
  cursor: not-allowed;
  transform: none;
}
</style>