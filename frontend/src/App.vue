<template>
  <div class="container">
    <h1>🧵 ThreadSpace</h1>
    <h2>Posts</h2>
    <ul>
      <li v-for="post in posts" :key="post._id">
        {{ post.title }}
      </li>
    </ul>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      posts: []
    }
  },
  mounted() {
    axios.get('http://localhost:3001/posts')
      .then(response => {
        this.posts = response.data
      })
      .catch(error => {
        console.error('Failed to load posts:', error)
      })
  }
}
</script>

<style>
body {
  font-family: Arial, sans-serif;
}
.container {
  max-width: 600px;
  margin: 2rem auto;
}
</style>

