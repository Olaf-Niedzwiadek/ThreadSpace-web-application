import axios from 'axios'
import { useAuth0 } from '@auth0/auth0-vue'

export default {
  setup() {
    const auth0 = useAuth0()
    return { 
      auth0
    }
  },
  data() {
    return {
      username: localStorage.getItem('username') || 'Guest',
      userId: localStorage.getItem('userId') || null,
      posts: [], 
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
      isLoadingPosts: false,

      showUserPosts: false,       
      userPosts: [],             
      isLoadingUserPosts: false,    

      showEditPostModal: false,     
      editingPost: null,            
      editPostForm: { body: '', imageUrl: '' }, 
      isUpdatingPost: false,        
      editPostError: '',           
      editPostSuccess: '',          

      isDeletingPost: null,         
      deletePostError: '',          
      deletePostSuccess: '',        

      newCommentBodies: {}, 
      replyingToCommentId: null, 
      replyingToCommentAuthor: '',
      newReplyBody: '', 
      showingComments: {},

      isLoadingFeed: false, // NEW: Loading state for the daily feed
      feedError: '',
    };
  },
  async mounted() {
  // Crucial check: if no userId, redirect to login
  if (!this.userId) {
    console.warn('No userId found in localStorage. Redirecting to login.');
    this.$router.push('/login');
    return; // Stop execution if no user is logged in
  }

  try {
    // Fetch user spaces
    const spaceRes = await axios.get(`http://localhost:3001/User/${this.userId}/spaces`);
    this.spaces = spaceRes.data;

    // NEW: Fetch daily feed posts
    await this.fetchDailyFeedPosts(); // Call the new method here

  } catch (error) {
    console.error('Failed to initialize app data (spaces or feed):', error);
    this.feedError = 'Failed to load your daily feed. Please try again.'; // Set error for feed
    this.spaces = []; // Ensure spaces are cleared on error as well
  }
},
  methods: {
    logout() {
      const authProvider = localStorage.getItem('authProvider')
      console.log('Logout - authProvider from localStorage:', authProvider)
      console.log('Logout - auth0 object:', this.auth0)
      console.log('Logout - isAuthenticated:', this.auth0?.isAuthenticated)
      console.log('Logout - user:', this.auth0?.user)
      
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('authProvider');
      
      if (authProvider === 'auth0' && this.auth0) {
        console.log('Logging out from Auth0...')
        this.auth0.logout({
          logoutParams: {
            returnTo: window.location.origin + '/login'
          }
        })
      } else {
        console.log('Local user logout')
        this.$router.push('/login');
      }
    },
    toggleSearch() {
      this.showSearchPanel = !this.showSearchPanel
      this.showCreateForm = false
      this.viewingSpace = null;
      this.showCreatePostForm = false; // Hide post form if visible
      this.resetPostForm(); // Clear post form data
      this.showUserPosts = false; // Hide user posts if visible
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
      this.showUserPosts = false; // Hide user posts if visible
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
      this.showUserPosts = false; // Hide user posts if visible
      this.newCommentBodies = {}; // Clear any pending new comment texts

      try {
        const spaceResponse = await axios.get(`http://localhost:3001/space/${space._id}`);
        this.viewingSpace = spaceResponse.data;

        // Fetch posts for this space
        await this.fetchPostsForSpace(space._id);
        
        this.showSearchPanel = false;
        this.showCreateForm = false;
      } catch (error) {
        console.error('Failed to fetch space details or posts:', error);
      } finally {
        this.isLoadingSpace = false;
      }
    },

    async fetchPostsForSpace(spaceId) {
      this.isLoadingPosts = true;
      try {
        const response = await axios.get(`http://localhost:3001/Post/space/${spaceId}`);
        console.log("Data fetched for space posts:", response.data);
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
      this.newCommentBodies = {}; // Clear any pending new comment texts
      this.showingComments = {};
       this.fetchDailyFeedPosts();
    },

    viewSpaceFromSidebar(space) {
      this.viewSpace(space); // Call the existing viewSpace method, which now fetches posts
      this.showSearchPanel = false;
      this.showCreateForm = false;
      this.showCreatePostForm = false; // Ensure post creation form is hidden
      this.resetPostForm(); // Clear post form data
      this.showUserPosts = false; // Hide user posts if visible
      this.showingComments = {};
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
                alert('No authentication token found. Please log in.');
                this.logout(); 
                return;
            }
            const url = `http://localhost:3001/Post/${postId}/${voteType}`;

            const response = await axios.put(url, {}, {
                headers: {
                    'x-auth-token': token
                }
            });

            const updatedPost = response.data.post;

            let postFound = false;
            let index = this.spacePosts.findIndex(p => p._id === updatedPost._id);
            if (index !== -1) {
                this.spacePosts[index] = updatedPost; 
                postFound = true;
            }

            if (!postFound && this.userPosts) { 
                index = this.userPosts.findIndex(p => p._id === updatedPost._id);
                if (index !== -1) {
                    this.userPosts[index] = updatedPost; 
                    postFound = true;
                }
            }

            if (!postFound && this.posts) {
            index = this.posts.findIndex(p => p._id === updatedPost._id);
                if (index !== -1) {
                    this.posts[index] = updatedPost;
                    postFound = true;
                }
            }

            if (!postFound) {
                console.warn('Could not find post with ID', updatedPost._id, 'in any relevant array. Consider re-fetching.');
                if (this.viewingSpace && this.viewingSpace._id) {
                    this.fetchPostsForSpace(this.viewingSpace._id);
                } else if (this.showUserPosts) {
                    this.fetchUserPosts();
                }
            }

        } catch (error) {
            console.error(`Failed to ${voteType} post:`, error);
            const serverErrorMessage = error.response?.data?.error || error.response?.data?.message;
            if (serverErrorMessage) {
                console.error(`Server response: ${serverErrorMessage}`);
            } else {
                console.error(`Network or client error: ${error.message || 'Unknown error'}`);
            }
            if (error.response?.status === 401) {
                console.warn('Authentication token expired or invalid. Logging out.');
                this.logout(); 
            } else if (error.response?.status === 403) {
                
                console.warn(`Vote blocked (403): ${error.response?.data?.error || 'Forbidden action'}`);
            }
        }
    },
    getUserVoteStatus(post) {
      const currentUserId = this.userId; 

      if (!currentUserId || !post.votes) return null;

      const userVote = post.votes.find(
        vote => {
            return vote.userId && vote.userId.toString() === currentUserId.toString();
        }
      );
      return userVote ? userVote.type : null;
    },

    // --- NEW METHODS FOR USER POSTS ---

    toggleUserPosts() {
      this.showUserPosts = !this.showUserPosts;
      // Reset other panels
      this.showSearchPanel = false;
      this.showCreateForm = false;
      this.viewingSpace = null;
      this.showCreatePostForm = false;
      this.resetPostForm(); // Ensure new post form is clear
      this.newCommentBodies = {}; // Clear any pending new comment texts

      if (this.showUserPosts) {
        this.fetchUserPosts(); // Fetch posts when entering this view
      } else {
        this.userPosts = []; // Clear posts when leaving this view
        this.deletePostError = ''; // Clear any leftover messages
        this.deletePostSuccess = '';
      }
    },

    closeUserPostsView() {
      this.showUserPosts = false;
      this.userPosts = [];
      this.deletePostError = '';
      this.deletePostSuccess = '';
      this.showingComments = {},
      this.fetchDailyFeedPosts();
    },

    async fetchUserPosts() {
      this.isLoadingUserPosts = true;
      this.userPosts = []; // Clear previous posts
      this.deletePostError = ''; // Clear any previous errors/successes
      this.deletePostSuccess = '';
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/login'); // Redirect to login if no token
          return;
        }
        const response = await axios.get(`http://localhost:3001/User/${this.userId}/posts`, {
          headers: {
            'x-auth-token': token
          }
        });
        this.userPosts = response.data;
      } catch (error) {
        console.error('Error fetching user posts:', error);
        this.deletePostError = error.response?.data?.error || 'Failed to load your posts. Please try again.';
        if (error.response?.status === 401) {
          this.logout(); // If unauthorized, log out
        }
      } finally {
        this.isLoadingUserPosts = false;
      }
    },

    openEditPostModal(post) {
      // Store a copy of the post being edited to avoid direct mutation issues
      this.editingPost = { ...post }; 
      // Pre-fill the form with current post data
      this.editPostForm.body = post.body;
      this.editPostForm.imageUrl = post.imageUrl;
      this.editPostError = '';
      this.editPostSuccess = '';
      this.showEditPostModal = true;
    },

    closeEditPostModal() {
      this.showEditPostModal = false;
      this.editingPost = null;
      this.editPostForm = { body: '', imageUrl: '' };
      this.isUpdatingPost = false;
      this.editPostError = '';
      this.editPostSuccess = '';
    },

    async handleEditPostSubmit() {
      this.isUpdatingPost = true;
      this.editPostError = '';
      this.editPostSuccess = '';

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token missing. Please log in again.');
        }

        // Determine postType based on imageUrl presence, similar to creation
        const postType = this.editPostForm.imageUrl ? 'image' : 'text';

        const updatedData = {
          body: this.editPostForm.body,
          imageUrl: this.editPostForm.imageUrl,
          postType: postType // Send the determined postType
        };

        const response = await axios.put(`http://localhost:3001/Post/${this.editingPost._id}`, updatedData, {
          headers: {
            'x-auth-token': token
          }
        });

        // Update the post in the local userPosts array
        const index = this.userPosts.findIndex(p => p._id === response.data._id);
        if (index !== -1) {
          this.userPosts[index] = response.data;
        }

        this.editPostSuccess = 'Post updated successfully!';
        setTimeout(() => {
          this.closeEditPostModal();
        }, 1500);

      } catch (error) {
        console.error('Failed to update post:', error);
        this.editPostError = error.response?.data?.error || 'Failed to update post. Please try again.';
        if (error.response?.status === 401) {
          this.logout(); // Redirect to login if unauthorized
        }
      } finally {
        this.isUpdatingPost = false;
      }
    },

    confirmDeletePost(post) {
      if (confirm(`Are you sure you want to delete the post titled "${post.title}"? This action cannot be undone.`)) {
        this.handleDeletePost(post._id);
      }
    },

    async handleDeletePost(postId) {
      this.isDeletingPost = postId;
      this.deletePostError = '';
      this.deletePostSuccess = '';

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token missing. Please log in again.');
        }

        await axios.delete(`http://localhost:3001/Post/${postId}`, {
          headers: {
            'x-auth-token': token
          }
        });

        // Remove the post from the local userPosts array
        this.userPosts = this.userPosts.filter(p => p._id !== postId);

        this.deletePostSuccess = 'Post deleted successfully!';
        // Small timeout for user to see success message, then clear it.
        setTimeout(() => {
          this.deletePostSuccess = '';
        }, 1500);

      } catch (error) {
        console.error('Failed to delete post:', error);
        this.deletePostError = error.response?.data?.error || 'Failed to delete post. Please try again.';
        if (error.response?.status === 401) {
          this.logout(); // Redirect to login if unauthorized
        }
      } finally {
        this.isDeletingPost = null;
      }
    },

    getUserCommentVoteStatus(comment) {
      if (!this.userId || !comment.votes) return null;
      const userVote = comment.votes.find(
        (vote) => vote.userId && vote.userId._id && this.userId && vote.userId._id.toString() === this.userId.toString()
      );
      return userVote ? userVote.type : null;
    },

    // Method to set which comment is being replied to
    setReplyingToComment(postId, commentId, authorUsername) {
      this.replyingToCommentId = commentId;
      this.replyingToCommentAuthor = authorUsername;
      this.newReplyBody = ''; // Clear reply text area
    },

    cancelReply() {
      this.replyingToCommentId = null;
      this.replyingToCommentAuthor = '';
      this.newReplyBody = '';
    },

    async handleCreateComment(postId, parentCommentId = null, body) {
        if (!this.userId) {
            alert('You must be logged in to comment.');
            this.logout();
            return;
        }
        if (!body || body.trim() === '') {
            alert('Comment body cannot be empty.');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Authentication token missing. Please log in again.');
            this.logout();
            return;
        }

        try {
            let url = `http://localhost:3001/Comment/${postId}`;
            if (parentCommentId) {
                url += `/${parentCommentId}`;
            }

            const commentData = {
                body: body,
            };

            const response = await axios.post(url, commentData, {
                headers: {
                    'x-auth-token': token
                }
            });

            const newComment = response.data;
            console.log("New comment created and received:", newComment); // Debugging

            const updateCommentsInArray = (arr, newCmt) => {
                const postIndex = arr.findIndex(p => p._id === postId);
                if (postIndex !== -1) {
                    const post = arr[postIndex];
                    if (newCmt.parentCommentId) {
                        // It's a reply
                        const parentComment = post.comments.find(c => c._id === newCmt.parentCommentId);
                        if (parentComment) {
                            // Ensure 'replies' array exists. In Vue 3, direct assignment works.
                            if (!parentComment.replies) {
                                parentComment.replies = []; // Direct assignment
                            }
                            parentComment.replies.push(newCmt);
                        }
                    } else {
                        // It's a top-level comment
                        if (!post.comments) {
                            post.comments = []; // Direct assignment
                        }
                        post.comments.unshift(newCmt);
                    }
                }
            };
            updateCommentsInArray(this.spacePosts, newComment);
            updateCommentsInArray(this.userPosts, newComment);
            updateCommentsInArray(this.posts, newComment);

            if (parentCommentId) {
                this.newReplyBody = '';
                this.cancelReply();
            } else {
                // Direct assignment works in Vue 3 if newCommentBodies is a reactive object
                if (this.newCommentBodies[postId] !== undefined) { // Check if property exists before assigning
                    this.newCommentBodies[postId] = '';
                }
            }
        } catch (error) {
            console.error('Failed to create comment:', error);
            alert(error.response?.data?.error || 'Failed to create comment. Please try again.');
            if (error.response?.status === 401) {
                this.logout();
            }
        }
    },

    async handleCommentVote(postId, commentId, type) {
      if (!this.userId) {
        alert('You must be logged in to vote on comments.');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication token missing. Please log in again.');
        this.logout();
        return;
      }

      try {
        const url = `http://localhost:3001/Comment/${commentId}/${type}`;
        const response = await axios.put(url, {}, {
          headers: {
            'x-auth-token': token
          }
        });

        const updatedComment = response.data.comment;

        // Function to update comment in a given array (spacePosts or userPosts)
        const updateCommentInPostArray = (postArray) => {
            const postIndex = postArray.findIndex(p => p._id === postId); // postId and updatedComment are assumed to be accessible in this scope
            if (postIndex !== -1) {
                const post = postArray[postIndex];

                // Find if it's a top-level comment
                let commentIndex = post.comments.findIndex(c => c._id === updatedComment._id);

                if (commentIndex !== -1) {
                    // Update top-level comment
                    // In Vue 3, direct assignment to an array index is reactive
                    post.comments[commentIndex] = updatedComment;
                } else {
                    // It might be a reply, search in replies
                    for (const topComment of post.comments) {
                        if (topComment.replies) {
                            const replyIndex = topComment.replies.findIndex(r => r._id === updatedComment._id);
                            if (replyIndex !== -1) {
                                // Update the reply
                                // In Vue 3, direct assignment to an array index is reactive
                                topComment.replies[replyIndex] = updatedComment;
                                break; // Found and updated, no need to continue
                            }
                        }
                    }
                }
            }
        };

        updateCommentInPostArray(this.spacePosts);
        updateCommentInPostArray(this.userPosts);
        updateCommentInPostArray(this.posts);

      } catch (error) {
        console.error(`Error ${type}ing comment:`, error);
        alert(error.response?.data?.error || `Failed to ${type} comment. Please try again.`);
        if (error.response?.status === 401) {
          this.logout();
        }
      }
    },

    confirmDeleteComment(postId, commentId, hasReplies) {
      if (confirm(`Are you sure you want to delete this comment${hasReplies ? ' and its replies' : ''}? This cannot be undone.`)) {
        this.handleDeleteComment(postId, commentId);
      }
    },

    async handleDeleteComment(postId, commentId) {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication token missing. Please log in again.');
        this.logout();
        return;
      }

      try {
        await axios.delete(`http://localhost:3001/Comment/${commentId}`, {
          headers: {
            'x-auth-token': token
          }
        });

        const removeCommentFromPostArray = (postArray) => {
            const postIndex = postArray.findIndex(p => p._id === postId); 
            if (postIndex !== -1) {
                const post = postArray[postIndex];

                // Try to remove as a top-level comment
                const initialCommentLength = post.comments.length;
                post.comments = post.comments.filter(c => c._id !== commentId);

                if (post.comments.length === initialCommentLength) {
                    for (let i = 0; i < post.comments.length; i++) {
                        if (post.comments[i].replies) {
                            const originalRepliesLength = post.comments[i].replies.length;
                            post.comments[i].replies = post.comments[i].replies.filter(r => r._id !== commentId);
                            if (post.comments[i].replies.length !== originalRepliesLength) {
                                break; 
                            }
                        }
                    }
                }
            }
        };

        removeCommentFromPostArray(this.spacePosts);
        removeCommentFromPostArray(this.userPosts);
        removeCommentFromPostArray(this.posts);
      } catch (error) {
        console.error('Failed to delete comment:', error);
        alert(error.response?.data?.error || 'Failed to delete comment. Please try again.');
        if (error.response?.status === 401) {
          this.logout();
        } else if (error.response?.status === 403) {
          alert("You are not authorized to delete this comment.");
        }
      }
    },
     toggleComments(postId) {
      this.showingComments[postId] = !this.showingComments[postId];
    },

    async fetchDailyFeedPosts() {
    this.isLoadingFeed = true;
    this.feedError = ''; // Clear previous errors
    this.posts = [];
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        this.$router.push('/login'); // Redirect to login if no token
        return;
      }

      const response = await axios.get(`http://localhost:3001/Post/feed/${this.userId}/today`, {
        headers: {
          'x-auth-token': token
        }
      });
      console.log("Daily Feed Posts fetched:", response.data);
      this.posts = response.data; 
    } catch (error) {
      console.error('Error fetching daily feed posts:', error);
      this.feedError = error.response?.data?.error || 'Failed to load daily feed. Please try again.';
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.logout();
      }
    } finally {
      this.isLoadingFeed = false;
    }
  },
  }
}