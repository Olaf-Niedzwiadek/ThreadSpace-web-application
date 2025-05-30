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
          <!-- Action buttons -->
          <div class="action-buttons">
            <button 
              class="search-button" 
              @click="toggleSearch"
              :class="{ active: showSearchPanel }"
            >
              {{ showSearchPanel ? 'Back to Feed' : 'Search for new threads' }}
            </button>
            <button 
              class="create-space-button" 
              @click="toggleCreateSpace"
              :class="{ active: showCreateForm }"
            >
              {{ showCreateForm ? 'Cancel' : 'Create Space' }}
            </button>
          </div>

          <!-- Search Panel -->
          <div v-if="showSearchPanel" class="search-panel">
            <h2>Find New Spaces to Join</h2>
            
            <div class="search-form">
              <div class="search-input-container">
                <input 
                  v-model="searchQuery"
                  @input="searchSpaces"
                  type="text" 
                  placeholder="Type space name to search..." 
                  class="search-input"
                  ref="searchInput"
                />
                <div class="search-icon">🔍</div>
              </div>
              
              <p v-if="searchQuery && searchResults.length === 0 && !isSearching" class="no-results">
                No spaces found matching "{{ searchQuery }}"
              </p>
              
              <div v-if="isSearching" class="loading">Searching...</div>
            </div>

            <!-- Search Results -->
            <div v-if="searchResults.length > 0" class="search-results">
              <h3>Available Spaces ({{ searchResults.length }})</h3>
              <ul class="results-list">
                <li
                  v-for="space in searchResults"
                  :key="space._id"
                  class="result-item"
                  @click="joinSpace(space)"
                >
                  <div class="space-info">
                    <div class="space-header">
                      <h4 class="space-name">{{ space.name }}</h4>
                      <span class="member-count">{{ space.members.length }} members</span>
                    </div>
                    <p class="space-description">{{ space.description || 'No description available' }}</p>
                    <div class="space-meta">
                      <span class="creator">Created by {{ space.creatorId.username }}</span>
                      <span class="created-date">{{ formatDate(space.createdAt) }}</span>
                    </div>
                  </div>
                  <button class="join-button" @click.stop="joinSpace(space)">
                    {{ isJoining === space._id ? 'Joining...' : 'Join Space' }}
                  </button>
                </li>
              </ul>
            </div>

            <!-- Join Status Messages -->
            <p v-if="joinError" class="error-message">{{ joinError }}</p>
            <p v-if="joinSuccess" class="success-message">{{ joinSuccess }}</p>
          </div>

          <!-- Create Space Form -->
          <div v-else-if="showCreateForm" class="create-space-form">
            <h2>Create New Space</h2>
            <form @submit.prevent="handleCreateSpace" class="space-form">
              <div class="form-group">
                <label for="spaceName">Space Name</label>
                <input 
                  id="spaceName"
                  v-model="newSpace.name" 
                  type="text" 
                  placeholder="Enter space name" 
                  required 
                  class="form-input"
                />
              </div>
              
              <div class="form-group">
                <label for="spaceDescription">Description</label>
                <textarea 
                  id="spaceDescription"
                  v-model="newSpace.description" 
                  placeholder="Describe your space..." 
                  rows="4"
                  class="form-textarea"
                ></textarea>
              </div>
              
              <div class="form-buttons">
                <button type="submit" class="submit-button" :disabled="isCreating">
                  {{ isCreating ? 'Creating...' : 'Create Space' }}
                </button>
                <button type="button" class="cancel-button" @click="cancelCreateSpace">
                  Cancel
                </button>
              </div>
            </form>
            
            <p v-if="createError" class="error-message">{{ createError }}</p>
            <p v-if="createSuccess" class="success-message">{{ createSuccess }}</p>
          </div>

          <!-- Regular Feed Content -->
          <div v-else>
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
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import './styles/feed.css'
import axios from 'axios'

export default {
  data() {
    return {
      username: localStorage.getItem('username') || 'Guest',
      posts: [],
      spaces: [],
      showCreateForm: false,
      showSearchPanel: false,
      isCreating: false,
      createError: '',
      createSuccess: '',
      newSpace: {
        name: '',
        description: ''
      },
      // Search functionality
      searchQuery: '',
      searchResults: [],
      isSearching: false,
      searchTimeout: null,
      joinError: '',
      joinSuccess: '',
      isJoining: null
    }
  },
  async mounted() {
    try {
      // Fetch posts
      const postRes = await axios.get('http://localhost:3001/posts')
      this.posts = postRes.data
    } catch (error) {
      console.error('Failed to fetch posts:', error)
      this.posts = [
        { _id: '1', title: 'Fallback: Welcome to ThreadSpace!' },
        { _id: '2', title: 'Fallback: Using threads effectively' }
      ]
    }

    try {
      // Fetch user spaces
      const userId = localStorage.getItem('userId')
      if (userId) {
        const spaceRes = await axios.get(`http://localhost:3001/user/${userId}/spaces`)
        this.spaces = spaceRes.data
      } else {
        console.warn('No userId found in localStorage.')
        this.spaces = []
      }
    } catch (error) {
      console.error('Failed to fetch spaces:', error)
      this.spaces = []
    }
  },
  methods: {
    logout() {
      this.$router.push('/login')
    },
    toggleSearch() {
      this.showSearchPanel = !this.showSearchPanel
      this.showCreateForm = false
      if (!this.showSearchPanel) {
        this.resetSearch()
      } else {
        // Focus on search input when panel opens
        this.$nextTick(() => {
          if (this.$refs.searchInput) {
            this.$refs.searchInput.focus()
          }
        })
      }
    },
    toggleCreateSpace() {
      this.showCreateForm = !this.showCreateForm
      this.showSearchPanel = false
      this.resetForm()
    },
    cancelCreateSpace() {
      this.showCreateForm = false
      this.resetForm()
    },
    resetForm() {
      this.newSpace = {
        name: '',
        description: ''
      }
      this.createError = ''
      this.createSuccess = ''
      this.isCreating = false
    },
    resetSearch() {
      this.searchQuery = ''
      this.searchResults = []
      this.isSearching = false
      this.joinError = ''
      this.joinSuccess = ''
      this.isJoining = null
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }
    },
    async searchSpaces() {
      // Clear previous timeout
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }
      
      // Clear previous messages
      this.joinError = ''
      this.joinSuccess = ''
      
      if (!this.searchQuery.trim()) {
        this.searchResults = []
        return
      }
      
      this.isSearching = true
      
      // Debounce search - wait 300ms after user stops typing
      this.searchTimeout = setTimeout(async () => {
        try {
          const userId = localStorage.getItem('userId')
          const response = await axios.get(`http://localhost:3001/space/search`, {
            params: {
              query: this.searchQuery,
              userId: userId // To exclude spaces user is already in
            }
          })
          this.searchResults = response.data
        } catch (error) {
          console.error('Search failed:', error)
          this.searchResults = []
        } finally {
          this.isSearching = false
        }
      }, 300)
    },
    async joinSpace(space) {
      this.isJoining = space._id
      this.joinError = ''
      this.joinSuccess = ''
      
      try {
        const userId = localStorage.getItem('userId')
        if (!userId) {
          this.joinError = 'User not logged in. Please log in again.'
          return
        }
        
        await axios.post('http://localhost:3001/space/join', {
          userId: userId,
          spaceId: space._id
        })
        
        // Add space to user's spaces locally
        this.spaces.push(space)
        
        // Remove from search results
        this.searchResults = this.searchResults.filter(s => s._id !== space._id)
        
        this.joinSuccess = `Successfully joined "${space.name}"!`
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.joinSuccess = ''
        }, 3000)
        
      } catch (error) {
        console.error('Failed to join space:', error)
        this.joinError = error.response?.data?.error || 'Failed to join space. Please try again.'
      } finally {
        this.isJoining = null
      }
    },
    async handleCreateSpace() {
      this.isCreating = true
      this.createError = ''
      this.createSuccess = ''

      try {
        const userId = localStorage.getItem('userId')
        if (!userId) {
          this.createError = 'User not logged in. Please log in again.'
          return
        }

        const spaceData = {
          name: this.newSpace.name,
          description: this.newSpace.description,
          creatorId: userId
        }

        const response = await axios.post('http://localhost:3001/space', spaceData)
        
        // Add the new space to the user's spaces list
        this.spaces.push(response.data)
        
        this.createSuccess = 'Space created successfully!'
        
        // Reset form after 2 seconds
        setTimeout(() => {
          this.showCreateForm = false
          this.resetForm()
        }, 2000)

      } catch (error) {
        console.error('Failed to create space:', error)
        this.createError = error.response?.data?.error || 'Failed to create space. Please try again.'
      } finally {
        this.isCreating = false
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    }
  }
}
</script>