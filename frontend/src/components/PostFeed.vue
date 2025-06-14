<template>
  <div class="app">
    <header class="top-bar">
      <div class="user">👤 {{ username }}</div>
      <div class="title">🧵 ThreadSpace</div>
      <button class="logout" @click="logout">Log Out</button>
    </header>

    <div class="main">
      <aside class="sidebar">
        <div class="sidebar-content">
          <h2>Your threads</h2>
          <ul>
            <li
              v-for="space in spaces"
              :key="space._id"
              class="thread-item"
              @click="viewSpaceFromSidebar(space)"
            >
              {{ space.name }}
            </li>
          </ul>
        </div>
      </aside>

      <section class="feed">
        <div class="feed-content">
          <div class="action-buttons" v-if="!viewingSpace && !showCreatePostForm">
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
                  <div class="space-actions" style="display: flex; gap: 8px;">
                    <button class="join-button view-button" @click.stop="viewSpace(space)">
                      View
                    </button>
                    <button class="join-button" @click.stop="joinSpace(space)">
                      {{ isJoining === space._id ? 'Joining...' : 'Join Space' }}
                    </button>
                  </div>
                </li>
              </ul>
            </div>

            <p v-if="joinError" class="error-message">{{ joinError }}</p>
            <p v-if="joinSuccess" class="success-message">{{ joinSuccess }}</p>
          </div>

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

          <div v-else-if="viewingSpace" class="space-view">
            <div class="space-view-header">
              <div class="header-top">
                  <h2 class="space-title">{{ viewingSpace.name }}</h2>
                  <button @click="closeSpaceView" class="back-button">← Back to Feed</button>
              </div>
              <p class="space-description">{{ viewingSpace.description }}</p>
              <div class="space-meta">
                <span>Created by: <strong>{{ viewingSpace.creatorId.username }}</strong></span>
                <span>Members: <strong>{{ viewingSpace.members.length }}</strong></span>
                <span>Created on: <strong>{{ formatDate(viewingSpace.createdAt) }}</strong></span>
              </div>
              <button class="create-post-button" @click="toggleCreatePostForm">
                {{ showCreatePostForm ? 'Cancel Post' : 'Create New Post' }}
              </button>
            </div>

            <div v-if="showCreatePostForm" class="create-post-form">
                <h3>Create a New Post in {{ viewingSpace.name }}</h3>
                <form @submit.prevent="handleCreatePost" class="post-form">
                    <div class="form-group">
                        <label for="postTitle">Title</label>
                        <input
                            id="postTitle"
                            v-model="newPost.title"
                            type="text"
                            placeholder="Enter post title"
                            required
                            class="form-input"
                        />
                    </div>
                    
                    <div class="form-group">
                        <label for="postBody">Body (Text)</label>
                        <textarea
                            id="postBody"
                            v-model="newPost.body"
                            placeholder="Share your thoughts..."
                            rows="6"
                            class="form-textarea"
                        ></textarea>
                    </div>

                    <div class="form-group">
                        <label for="postImageUrl">Image URL (Optional)</label>
                        <input
                            id="postImageUrl"
                            v-model="newPost.imageUrl"
                            type="url"
                            placeholder="Paste image URL here"
                            class="form-input"
                        />
                    </div>
                    
                    <div class="form-buttons">
                        <button type="submit" class="submit-button" :disabled="isCreatingPost">
                            {{ isCreatingPost ? 'Posting...' : 'Create Post' }}
                        </button>
                        <button type="button" class="cancel-button" @click="cancelCreatePost">
                            Cancel
                        </button>
                    </div>
                </form>
                <p v-if="postError" class="error-message">{{ postError }}</p>
                <p v-if="postSuccess" class="success-message">{{ postSuccess }}</p>
            </div>

            <div v-else class="posts-panel">
              <h3>Posts in {{ viewingSpace.name }}</h3>
              <div v-if="isLoadingPosts" class="loading">Loading posts...</div>
              <div v-else-if="spacePosts.length === 0" class="placeholder-text">
                No posts yet. Be the first to create one!
              </div>
              <ul class="posts-list">
                <li
                  v-for="post in spacePosts"
                  :key="post._id"
                  class="post-item"
                >
                  <div class="post-header">
                    <h4 class="post-title">{{ post.title }}</h4>
                    <span class="post-author">by {{ post.authorId.username }}</span>
                    <span class="post-date">{{ formatDate(post.createdAt) }}</span>
                  </div>
                  <p class="post-body">{{ post.body }}</p>
                  <img v-if="post.imageUrl" :src="post.imageUrl" class="post-image" alt="Post Image"/>
                  <div class="post-actions">
                    <button
                      class="vote-button upvote"
                      :class="{ 'active-vote': getUserVoteStatus(post) === 'upvote' }"
                      @click="handleVote(post._id, 'upvote')"
                      :disabled="!userId"
                    >
                      👍 {{ post.upvoteCount }}
                    </button>
                    <button
                      class="vote-button downvote"
                      :class="{ 'active-vote': getUserVoteStatus(post) === 'downvote' }"
                      @click="handleVote(post._id, 'downvote')"
                      :disabled="!userId"
                    >
                      👎 {{ post.downvoteCount }}
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div v-else>
            <h2>ThreadSpace Feed</h2>
            <p v-if="posts.length === 0">No general feed posts available.</p>
            <ul>
              <li
                v-for="post in posts"
                :key="post._id"
                class="post-item"
              >
                {{ post.title }} </li>
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
      userId: localStorage.getItem('userId') || null,
      posts: [], // Keep this for general feed, if you eventually use it
      spaces: [],
      showCreateForm: false,
      showSearchPanel: false,
      isCreating: false,
      createError: '',
      createSuccess: '',
      newSpace: { name: '', description: '' },
      searchQuery: '',
      searchResults: [],
      isSearching: false,
      searchTimeout: null,
      joinError: '',
      joinSuccess: '',
      isJoining: null,
      viewingSpace: null,
      isLoadingSpace: false,
      showCreatePostForm: false,
      newPost: { title: '', body: '', imageUrl: '', postType: 'text' },
      isCreatingPost: false,
      postError: '',
      postSuccess: '',
      spacePosts: [],
      isLoadingPosts: false
    };
  },
  async mounted() {
    // Crucial check: if no userId, redirect to login
    if (!this.userId) {
      console.warn('No userId found in localStorage. Redirecting to login.');
      this.$router.push('/login');
      return; // Stop execution if no user is logged in
    }

    /*
    // This block for 'general feed posts' is commented out as your backend doesn't have '/posts'
    // If you add a general feed route in the future, uncomment and adjust.
    try {
      // const postRes = await axios.get('http://localhost:3001/posts')
      // this.posts = postRes.data
    } catch (error) {
      console.error('Failed to fetch general feed posts:', error)
      this.posts = [
        { _id: '1', title: 'Fallback: Welcome to ThreadSpace!' },
        { _id: '2', title: 'Fallback: Using threads effectively' }
      ]
    }
    */

    try {
      // Fetch user spaces - this route typically doesn't need a token, as userId is in the URL
      const spaceRes = await axios.get(`http://localhost:3001/User/${this.userId}/spaces`);
      this.spaces = spaceRes.data;
    } catch (error) {
      console.error('Failed to fetch spaces:', error);
      this.spaces = [];
      // Optionally handle error, e.g., if user doesn't exist or server error
      // this.error = "Failed to load your spaces. Please try again later."
    }
  },
  methods: {
    logout() {
      // Clear all authentication-related items from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      this.$router.push('/login'); // Redirect to login page
    },
    toggleSearch() {
      this.showSearchPanel = !this.showSearchPanel
      this.showCreateForm = false
      this.viewingSpace = null;
      this.showCreatePostForm = false; // Hide post form if visible
      this.resetPostForm(); // Clear post form data
      if (!this.showSearchPanel) {
        this.resetSearch()
      } else {
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
      this.viewingSpace = null;
      this.showCreatePostForm = false; // Hide post form if visible
      this.resetPostForm(); // Clear post form data
      this.resetForm() // Reset space form
    },
    cancelCreateSpace() {
      this.showCreateForm = false
      this.resetForm()
    },
    resetForm() { // Resets Create Space form
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
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }
      
      this.joinError = ''
      this.joinSuccess = ''
      
      if (!this.searchQuery.trim()) {
        this.searchResults = []
        return
      }
      
      this.isSearching = true
      
      this.searchTimeout = setTimeout(async () => {
        try {
          // No token needed for search if backend search route is public
          const response = await axios.get(`http://localhost:3001/space/search`, {
            params: {
              query: this.searchQuery,
              userId: this.userId // Still send userId for join status
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

    async viewSpace(space) {
      this.isLoadingSpace = true;
      this.viewingSpace = null; // Clear previous space data
      this.spacePosts = []; // Clear previous posts
      this.postError = ''; // Clear post errors
      this.postSuccess = ''; // Clear post successes
      this.showCreatePostForm = false; // Ensure post creation form is hidden

      try {
        const spaceResponse = await axios.get(`http://localhost:3001/space/${space._id}`);
        this.viewingSpace = spaceResponse.data;

        // Fetch posts for this space
        await this.fetchPostsForSpace(space._id);
        
        this.showSearchPanel = false;
        this.showCreateForm = false;
      } catch (error) {
        console.error('Failed to fetch space details or posts:', error);
        // Display error message to user if necessary
        // this.error = "Failed to load space. Please try again."
      } finally {
        this.isLoadingSpace = false;
      }
    },

    async fetchPostsForSpace(spaceId) {
      this.isLoadingPosts = true;
      try {
        const response = await axios.get(`http://localhost:3001/Post/space/${spaceId}`);
        this.spacePosts = response.data;
      } catch (error) {
        console.error('Error fetching posts for space:', error);
        this.spacePosts = []; // Clear posts on error
      } finally {
        this.isLoadingPosts = false;
      }
    },

    closeSpaceView() {
      this.viewingSpace = null;
      this.showSearchPanel = false;
      this.showCreateForm = false;
      this.showCreatePostForm = false; // Ensure post creation form is hidden
      this.resetPostForm(); // Clear post form data
      this.spacePosts = []; // Clear posts when leaving a space view
    },

    viewSpaceFromSidebar(space) {
      this.viewSpace(space); // Call the existing viewSpace method, which now fetches posts
      this.showSearchPanel = false;
      this.showCreateForm = false;
      this.showCreatePostForm = false; // Ensure post creation form is hidden
      this.resetPostForm(); // Clear post form data
    },

    async joinSpace(space) {
      this.isJoining = space._id
      this.joinError = ''
      this.joinSuccess = ''
      
      try {
        if (!this.userId) { // Use this.userId from component data
          this.joinError = 'User not logged in. Please log in again.'
          return
        }
        
        const isAlreadyMember = this.spaces.some(s => s._id === space._id)
        if (isAlreadyMember) {
          this.joinError = 'You are already a member of this space.'
          return
        }
        
        const response = await axios.post('http://localhost:3001/space/join', {
          userId: this.userId, // Use this.userId
          spaceId: space._id
        })
        
        if (response.status === 200) {
          this.spaces.push(space)
          this.searchResults = this.searchResults.filter(s => s._id !== space._id)
          this.joinSuccess = `Successfully joined "${space.name}"!`
          
          setTimeout(() => {
            this.joinSuccess = ''
          }, 3000)
        }
        
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
        if (!this.userId) { // Use this.userId from component data
          this.createError = 'User not logged in. Please log in again.'
          return
        }

        const spaceData = {
          name: this.newSpace.name,
          description: this.newSpace.description,
          creatorId: this.userId // Use this.userId
        }

        const response = await axios.post('http://localhost:3001/space', spaceData)
        
        this.spaces.push(response.data)
        
        this.createSuccess = 'Space created successfully!'
        
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

    // NEW: Post-related methods
    toggleCreatePostForm() {
      this.showCreatePostForm = !this.showCreatePostForm;
      if (!this.showCreatePostForm) {
        this.resetPostForm(); // Clear form if cancelled
      }
    },

    cancelCreatePost() {
      this.showCreatePostForm = false;
      this.resetPostForm();
    },

    resetPostForm() {
      this.newPost = {
        title: '',
        body: '',
        imageUrl: '',
        postType: 'text'
      };
      this.postError = '';
      this.postSuccess = '';
      this.isCreatingPost = false;
    },

    async handleCreatePost() {
      this.isCreatingPost = true;
      this.postError = '';
      this.postSuccess = '';

      try {
        const token = localStorage.getItem('token'); // Get the token
        if (!token) {
          this.postError = 'Authentication token missing. Please log in again.';
          this.$router.push('/login'); 
          return;
        }

        if (!this.viewingSpace || !this.viewingSpace._id) {
            this.postError = 'No space selected to create a post in.';
            return;
        }

        const postType = this.newPost.imageUrl ? 'image' : 'text';

        const postData = {
          title: this.newPost.title,
          body: this.newPost.body,
          imageUrl: this.newPost.imageUrl,
          postType: postType,
          spaceId: this.viewingSpace._id
        };

        const response = await axios.post('http://localhost:3001/Post', postData, {
          headers: {
            'x-auth-token': token
          }
        }); 

        // Add the new post to the spacePosts array directly from the response
        // The backend should now return the fully populated post
        this.spacePosts.unshift(response.data); // Add to the beginning of the array for newest first

        this.postSuccess = 'Post created successfully!';
        
        setTimeout(() => {
          this.showCreatePostForm = false;
          this.resetPostForm();
        }, 2000);

      } catch (error) {
        console.error('Failed to create post:', error);
        if (error.response && error.response.status === 401) {
            this.postError = 'Authentication failed. Please log in again.';
            this.logout();
        } else {
            this.postError = error.response?.data?.error || 'Failed to create post. Please try again.';
        }
      } finally {
        this.isCreatingPost = false;
      }
    },

    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    async handleVote(postId, voteType) {
      if (!this.userId) {
        alert('You must be logged in to vote.');
        return;
      }

      console.log(`Attempting to ${voteType} post: ${postId}`);

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }

        const url = `http://localhost:3001/Post/${postId}/${voteType}`;

        // Log the current state of the post before the API call
        const currentPostIndex = this.spacePosts.findIndex(p => p._id === postId);
        if (currentPostIndex !== -1) {
            console.log('Post state BEFORE API call:', JSON.parse(JSON.stringify(this.spacePosts[currentPostIndex])));
        }

        const response = await axios.put(url, {}, {
          headers: {
            'x-auth-token': token
          }
        });

        const updatedPost = response.data.post; 
        const index = this.spacePosts.findIndex(p => p._id === updatedPost._id);
        console.log('Found index in spacePosts:', index);

        if (index !== -1) {
      
        this.spacePosts[index] = updatedPost;

        console.log('Post successfully updated in spacePosts at index', index);
        console.log('New state in spacePosts array:', JSON.parse(JSON.stringify(this.spacePosts[index])));
        } else {
          console.warn('Could not find post with ID', updatedPost._id, 'in spacePosts array. Cannot update locally.');
          if (this.viewingSpace && this.viewingSpace._id) {
            this.fetchPostsForSpace(this.viewingSpace._id);
          }
        }

      } catch (error) {
        console.error(`Error ${voteType}ing post:`, error);
      }
    },

    // Helper to determine user's current vote status for a post
    getUserVoteStatus(post) {
      if (!this.userId || !post.votes) return null;

      const userVote = post.votes.find(
        // Ensure vote.userId is an object and has an _id for comparison
        vote => vote.userId && vote.userId._id && this.userId && vote.userId._id.toString() === this.userId.toString()
      );
      return userVote ? userVote.type : null;
    }
  }
}
</script>