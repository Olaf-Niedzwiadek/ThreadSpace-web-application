<template>
  <div class="app">
    <!-- 🔝 Top Banner -->
    <header class="top-bar">
      <div class="user">👤 {{ username }}</div>
      <div class="title">🧵 ThreadSpace</div>
      <button class="logout" @click="logout">Log Out</button>
    </header>

    <div class="main">
      <!-- Sidebar with threads -->
      <aside class="sidebar">
        <div class="sidebar-content">
          <h2>Your threads</h2>
          <ul>
            <li
              v-for="space in spaces"
              :key="space._id"
              class="thread-item"
            >
              {{ space.name }}
            </li>
          </ul>
        </div>
      </aside>

      <!-- Feed Panel -->
      <section class="feed">
        <div class="feed-content">
          <button class="search-button" @click="searchThreads">
            Search for new threads
          </button>
          <h2>ThreadSpace Feed</h2>
          <ul>
            <li
              v-for="post in posts"
              :key="post._id"
              class="post-item"
            >
              {{ post.title }}
            </li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      username: localStorage.getItem('username') || 'Guest',
      posts: [],
      spaces: []
    }
  },
  async mounted() {
    try {
      const postRes = await axios.get('http://localhost:3001/posts')
      this.posts = postRes.data
    } catch (error) {
      this.posts = [
        { _id: '1', title: 'Welcome to ThreadSpace!' },
        { _id: '2', title: 'How to use threads effectively' },
        { _id: '3', title: 'Best practices for community building' },
        { _id: '4', title: 'Tips for engaging discussions' },
        { _id: '5', title: 'Managing your thread subscriptions' },
        { _id: '6', title: 'Advanced search techniques' },
        { _id: '7', title: 'Customizing your profile' },
        { _id: '8', title: 'Understanding thread moderation' },
        { _id: '9', title: 'Creating quality content' },
        { _id: '10', title: 'Building your network' },
        { _id: '11', title: 'Thread etiquette guidelines' },
        { _id: '12', title: 'Using hashtags effectively' },
        { _id: '13', title: 'Scheduling your posts' },
        { _id: '14', title: 'Analytics and insights' },
        { _id: '15', title: 'Mobile app features' }
      ]
    }

    this.spaces = [
      { _id: '1', name: 'General Discussion' },
      { _id: '2', name: 'Tech Talk' },
      { _id: '3', name: 'Random Thoughts' },
      { _id: '4', name: 'Project Updates' },
      { _id: '5', name: 'Q&A Session' },
      { _id: '6', name: 'Weekly Digest' },
      { _id: '7', name: 'Community Events' },
      { _id: '8', name: 'Feedback Corner' },
      { _id: '9', name: 'Resource Sharing' },
      { _id: '10', name: 'Off-topic Chat' },
      { _id: '11', name: 'News & Updates' },
      { _id: '12', name: 'Help & Support' },
      { _id: '13', name: 'Feature Requests' },
      { _id: '14', name: 'Bug Reports' },
      { _id: '15', name: 'Success Stories' }
    ]
  },
  methods: {
    logout() {
      this.$router.push('/login')
    },
    searchThreads() {
      this.$router.push('/search')
    }
  }
}
</script>

<style scoped>
/* Full Page Wrapper */
.app {
  background-color: #1e1e1e;
  color: #ffffff;
  min-height: 100vh;
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden; /* Prevent page-level scrolling */
}

/* 🔝 Top Banner - fixed */
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #2a2a2a;
  padding: 0 1.5rem;
  height: 60px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  gap: 1rem;
  z-index: 1000;
}

.top-bar .user {
  flex: 0 0 auto;
  font-size: 1.1rem;
  font-weight: 600;
  color: #d1bfff;
  transform: translateX(+20%);
}

.top-bar .title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.5rem;
  font-weight: bold;
  white-space: nowrap;
  color: #fff;
}

.top-bar .logout {
  flex: 0 0 auto;
  background: #444;
  transform: translateX(-20%);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  white-space: nowrap;
}

.top-bar .logout:hover {
  background: #666;
}

/* 🔄 Main Content */
.main {
  display: flex;
  height: 100vh;
  padding-top: 60px; /* Account for fixed top bar */
  box-sizing: border-box;
}

/* Sidebar - independent scrolling */
.sidebar {
  width: 280px;
  background: #2b2b2b;
  border-right: 1px solid #444;
  overflow: hidden; /* Hide scrollbar until hover */
  flex-shrink: 0;
}

.sidebar:hover {
  overflow-y: auto; /* Show scrollbar on hover */
}

.sidebar-content {
  padding: 1.5rem 1rem;
  height: 100%;
  box-sizing: border-box;
}

.sidebar h2 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  text-align: center;
  color: #fff;
  position: sticky;
  top: 0;
  background: #2b2b2b;
  padding: 0.5rem 0;
  z-index: 10;
}

.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.thread-item {
  background: #383838;
  border: 1px solid #555;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  text-align: center;
  box-sizing: border-box;
  transition: background-color 0.2s ease;
}

.thread-item:hover {
  background: #444;
}

/* 📄 Feed - independent scrolling */
.feed {
  flex: 1;
  background: #2b2b2b;
  overflow: hidden; /* Hide scrollbar until hover */
}

.feed:hover {
  overflow-y: auto; /* Show scrollbar on hover */
}

.feed-content {
  padding: 1.5rem;
  height: 100%;
  box-sizing: border-box;
}

.search-button {
  background: #555;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background-color 0.2s ease;
}

.search-button:hover {
  background: #777;
}

.feed h2 {
  font-size: 1.4rem;
  margin-bottom: 1.5rem;
  color: #fff;
  position: sticky;
  top: 0;
  background: #2b2b2b;
  padding: 0.5rem 0;
  z-index: 10;
}

.feed ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.post-item {
  background: #383838;
  border: 1px solid #555;
  padding: 1rem;
  margin-bottom: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  box-sizing: border-box;
}

.post-item:hover {
  background: #444;
}

/* Custom scrollbar styling for webkit browsers */
.sidebar:hover::-webkit-scrollbar,
.feed:hover::-webkit-scrollbar {
  width: 8px;
}

.sidebar:hover::-webkit-scrollbar-track,
.feed:hover::-webkit-scrollbar-track {
  background: #2a2a2a;
}

.sidebar:hover::-webkit-scrollbar-thumb,
.feed:hover::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

.sidebar:hover::-webkit-scrollbar-thumb:hover,
.feed:hover::-webkit-scrollbar-thumb:hover {
  background: #777;
}

/* Responsive design */
@media (max-width: 768px) {
  .main {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: 200px;
  }
  
  .feed {
    flex: 1;
  }
}
</style>

