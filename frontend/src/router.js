// src/router.js
import { createRouter, createWebHistory } from 'vue-router'

import LoginForm from './components/LoginForm.vue'
import RegisterForm from './components/RegisterForm.vue'
import PostFeed from './components/PostFeed.vue'
import AuthCallback from './components/AuthCallback.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginForm },
  { path: '/register', component: RegisterForm },
  { path: '/feed', component: PostFeed },
  { path: '/auth/callback', component: AuthCallback }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router