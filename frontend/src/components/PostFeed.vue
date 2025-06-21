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
          <div class="action-buttons" v-if="!viewingSpace && !showCreatePostForm && !showUserPosts">
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
            <button
              class="view-my-posts-button"
              @click="toggleUserPosts"
            >
              See your posts
            </button>
          </div>
          <div class="action-buttons" v-if="showUserPosts">
              <button class="search-button" @click="closeUserPostsView">← Back to Feed</button>
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
                <li v-for="post in spacePosts" :key="post._id" class="post-item">
                  <div class="post-header">
                    <h4 class="post-title">{{ post.title }}</h4>
                    <span class="post-author">by {{ post.authorId.username }}</span>
                    <span class="post-date">{{ formatDate(post.createdAt) }}</span>
                  </div>
                  <p class="post-body">{{ post.body }}</p>
                  <img v-if="post.imageUrl" :src="post.imageUrl" class="post-image" alt="Post Image" />
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

                  <div class="comments-toggle">
                    <button @click="toggleComments(post._id)" class="show-hide-comments-button">
                      {{ showingComments[post._id] ? 'Hide Comments' : 'Show Comments' }}
                    </button>
                  </div>

                  <div v-if="showingComments[post._id]" class="comments-section-wrapper">
                    <div class="comments-section">
                      <h4>Comments</h4>
                      <div class="comment-create-form">
                        <textarea
                          v-model="newCommentBodies[post._id]"
                          placeholder="Add a comment..."
                          rows="3"
                          class="comment-textarea"
                        ></textarea>
                        <button
                          @click="handleCreateComment(post._id, null, newCommentBodies[post._id])"
                          class="submit-button"
                          :disabled="!newCommentBodies[post._id] || newCommentBodies[post._id].trim() === ''"
                        >
                          Add Comment
                        </button>
                      </div>

                      <div class="comment-list-container">
                        <div v-if="post.comments && post.comments.length === 0" class="no-comments-placeholder">
                          No comments yet. Be the first to comment!
                        </div>
                        <div v-else class="comments-wrapper">
                          <div
                            v-for="comment in post.comments"
                            :key="comment._id"
                            class="comment-item"
                          >
                            <div class="comment-header">
                              <span class="comment-author"><strong>{{ comment.authorId.username }}</strong></span>
                              <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
                            </div>
                            <p class="comment-body">{{ comment.body }}</p>
                            <div class="comment-actions">
                              <button
                                class="vote-button upvote"
                                :class="{ 'active-vote': getUserCommentVoteStatus(comment) === 'upvote' }"
                                @click="handleCommentVote(post._id, comment._id, 'upvote')"
                                :disabled="userId === comment.authorId._id"
                              >
                                👍 {{ comment.upvoteCount }}
                              </button>
                              <button
                                class="vote-button downvote"
                                :class="{ 'active-vote': getUserCommentVoteStatus(comment) === 'downvote' }"
                                @click="handleCommentVote(post._id, comment._id, 'downvote')"
                                :disabled="userId === comment.authorId._id"
                              >
                                👎 {{ comment.downvoteCount }}
                              </button>
                              <button
                                v-if="userId === comment.authorId._id"
                                class="delete-button"
                                @click="confirmDeleteComment(post._id, comment._id, comment.replies && comment.replies.length > 0)"
                              >
                                Delete
                              </button>
                              <button
                                v-if="!comment.parentCommentId && replyingToCommentId !== comment._id"
                                class="reply-button"
                                @click="setReplyingToComment(post._id, comment._id, comment.authorId.username)"
                              >
                                Reply
                              </button>
                            </div>

                            <div v-if="replyingToCommentId === comment._id" class="reply-form-container">
                              <div class="reply-to-info">Replying to {{ replyingToCommentAuthor }}</div>
                              <textarea
                                v-model="newReplyBody"
                                placeholder="Write your reply..."
                                rows="3"
                                class="comment-textarea"
                              ></textarea>
                              <div class="reply-form-actions">
                                <button @click="handleCreateComment(post._id, comment._id, newReplyBody)" class="submit-button">Submit Reply</button>
                                <button @click="cancelReply" class="cancel-button">Cancel</button>
                              </div>
                            </div>

                            <div v-if="comment.replies && comment.replies.length > 0" class="comment-replies">
                              <div
                                v-for="reply in comment.replies"
                                :key="reply._id"
                                class="comment-item is-reply"
                              >
                                <div class="comment-header">
                                  <span class="comment-author"><strong>{{ reply.authorId.username }}</strong></span>
                                  <span class="comment-date">{{ formatDate(reply.createdAt) }}</span>
                                </div>
                                <p class="comment-body">{{ reply.body }}</p>
                                <div class="comment-actions">
                                  <button
                                    class="vote-button upvote"
                                    :class="{ 'active-vote': getUserCommentVoteStatus(reply) === 'upvote' }"
                                    @click="handleCommentVote(post._id, reply._id, 'upvote')"
                                    :disabled="userId === reply.authorId._id"
                                  >
                                    👍 {{ reply.upvoteCount }}
                                  </button>
                                  <button
                                    class="vote-button downvote"
                                    :class="{ 'active-vote': getUserCommentVoteStatus(reply) === 'downvote' }"
                                    @click="handleCommentVote(post._id, reply._id, 'downvote')"
                                    :disabled="userId === reply.authorId._id"
                                  >
                                    👎 {{ reply.downvoteCount }}
                                  </button>
                                  <button
                                    v-if="userId === reply.authorId._id"
                                    class="delete-button"
                                    @click="confirmDeleteComment(post._id, reply._id, false)"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div v-else-if="showUserPosts" class="user-posts-panel">
            <div class="user-posts-header">
              <h2 class="section-title">Your Posts</h2>
            </div>
            <div v-if="isLoadingUserPosts" class="loading">Loading your posts...</div>
            <div v-else-if="userPosts.length === 0" class="placeholder-text">
              You haven't created any posts yet.
            </div>
            <ul class="posts-list">
              <li v-for="post in userPosts" :key="post._id" class="post-item">
                <div class="post-header">
                  <h4 class="post-title">{{ post.title }}</h4>
                  <span class="post-space-name"
                    >in <strong @click="viewSpace(post.spaceId)" class="clickable-space-name">{{ post.spaceId.name }}</strong></span
                  >
                  <span class="post-author">by {{ post.authorId.username }}</span>
                  <span class="post-date">{{ formatDate(post.createdAt) }}</span>
                </div>
                <p class="post-body">{{ post.body }}</p>
                <img v-if="post.imageUrl" :src="post.imageUrl" class="post-image" alt="Post Image" />
                <div class="post-actions">
                  <button
                    class="vote-button upvote"
                    :class="{ 'active-vote': getUserVoteStatus(post) === 'upvote' }"
                    @click="handleVote(post._id, 'upvote')"
                    :disabled="!userId || post.authorId._id === userId"
                  >
                    👍 {{ post.upvoteCount }}
                  </button>
                  <button
                    class="vote-button downvote"
                    :class="{ 'active-vote': getUserVoteStatus(post) === 'downvote' }"
                    @click="handleVote(post._id, 'downvote')"
                    :disabled="!userId || post.authorId._id === userId"
                  >
                    👎 {{ post.downvoteCount }}
                  </button>
                  <button class="edit-button" @click="openEditPostModal(post)">Edit</button>
                  <button class="delete-button" @click="confirmDeletePost(post)">Delete</button>
                </div>

                <div class="comments-toggle">
                  <button @click="toggleComments(post._id)" class="show-hide-comments-button">
                    {{ showingComments[post._id] ? 'Hide Comments' : 'Show Comments' }}
                  </button>
                </div>

                <div v-if="showingComments[post._id]" class="comments-section-wrapper">
                  <div class="comments-section">
                    <h4>Comments</h4>
                    <div class="comment-create-form">
                      <textarea
                        v-model="newCommentBodies[post._id]"
                        placeholder="Add a comment..."
                        rows="3"
                        class="comment-textarea"
                      ></textarea>
                      <button
                        @click="handleCreateComment(post._id, null, newCommentBodies[post._id])"
                        class="submit-button"
                        :disabled="!newCommentBodies[post._id] || newCommentBodies[post._id].trim() === ''"
                      >
                        Add Comment
                      </button>
                    </div>
                    <div class="comment-list-container">
                      <div v-if="post.comments && post.comments.length === 0" class="no-comments-placeholder">
                        No comments yet. Be the first to comment!
                      </div>
                      <div v-else class="comments-wrapper">
                        <div v-for="comment in post.comments" :key="comment._id" class="comment-item">
                          <div class="comment-header">
                            <span class="comment-author"><strong>{{ comment.authorId.username }}</strong></span>
                            <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
                          </div>
                          <p class="comment-body">{{ comment.body }}</p>
                          <div class="comment-actions">
                            <button
                              class="vote-button upvote"
                              :class="{ 'active-vote': getUserCommentVoteStatus(comment) === 'upvote' }"
                              @click="handleCommentVote(post._id, comment._id, 'upvote')"
                              :disabled="userId === comment.authorId._id"
                            >
                              👍 {{ comment.upvoteCount }}
                            </button>
                            <button
                              class="vote-button downvote"
                              :class="{ 'active-vote': getUserCommentVoteStatus(comment) === 'downvote' }"
                              @click="handleCommentVote(post._id, comment._id, 'downvote')"
                              :disabled="userId === comment.authorId._id"
                            >
                              👎 {{ comment.downvoteCount }}
                            </button>
                            <button
                              v-if="userId === comment.authorId._id"
                              class="delete-button"
                              @click="confirmDeleteComment(post._id, comment._id, comment.replies && comment.replies.length > 0)"
                            >
                              Delete
                            </button>
                            <button
                              v-if="!comment.parentCommentId && replyingToCommentId !== comment._id"
                              class="reply-button"
                              @click="setReplyingToComment(post._id, comment._id, comment.authorId.username)"
                            >
                              Reply
                            </button>
                          </div>

                          <div v-if="replyingToCommentId === comment._id" class="reply-form-container">
                            <div class="reply-to-info">Replying to {{ replyingToCommentAuthor }}</div>
                            <textarea
                              v-model="newReplyBody"
                              placeholder="Write your reply..."
                              rows="3"
                              class="comment-textarea"
                            ></textarea>
                            <div class="reply-form-actions">
                              <button @click="handleCreateComment(post._id, comment._id, newReplyBody)" class="submit-button">
                                Submit Reply
                              </button>
                              <button @click="cancelReply" class="cancel-button">Cancel</button>
                            </div>
                          </div>

                          <div v-if="comment.replies && comment.replies.length > 0" class="comment-replies">
                            <div v-for="reply in comment.replies" :key="reply._id" class="comment-item is-reply">
                              <div class="comment-header">
                                <span class="comment-author"><strong>{{ reply.authorId.username }}</strong></span>
                                <span class="comment-date">{{ formatDate(reply.createdAt) }}</span>
                              </div>
                              <p class="comment-body">{{ reply.body }}</p>
                              <div class="comment-actions">
                                <button
                                  class="vote-button upvote"
                                  :class="{ 'active-vote': getUserCommentVoteStatus(reply) === 'upvote' }"
                                  @click="handleCommentVote(post._id, reply._id, 'upvote')"
                                  :disabled="userId === reply.authorId._id"
                                >
                                  👍 {{ reply.upvoteCount }}
                                </button>
                                <button
                                  class="vote-button downvote"
                                  :class="{ 'active-vote': getUserCommentVoteStatus(reply) === 'downvote' }"
                                  @click="handleCommentVote(post._id, reply._id, 'downvote')"
                                  :disabled="userId === reply.authorId._id"
                                >
                                  👎 {{ reply.downvoteCount }}
                                </button>
                                <button
                                  v-if="userId === reply.authorId._id"
                                  class="delete-button"
                                  @click="confirmDeleteComment(post._id, reply._id, false)"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
            <p v-if="deletePostSuccess" class="success-message">{{ deletePostSuccess }}</p>
            <p v-if="deletePostError" class="error-message">{{ deletePostError }}</p>
          </div>

          <div v-else>
            <h2 class="section-title">Your daily ThreadSpace Feed</h2>
            <div v-if="isLoadingFeed" class="loading">Loading today's posts...</div>
            <div v-else-if="feedError" class="error-message">{{ feedError }}</div>
            <div v-else-if="posts.length === 0" class="placeholder-text">
              No new posts from your joined spaces today.
            </div>
            <ul v-else class="posts-list">
              <li v-for="post in posts" :key="post._id" class="post-item">
                <div class="post-header">
                  <h4 class="post-title">{{ post.title }}</h4>
                  <span class="post-space-name"
                    >in <strong @click="viewSpace(post.spaceId)" class="clickable-space-name">{{ post.spaceId.name }}</strong></span
                  >
                  <span class="post-author">by {{ post.authorId.username }}</span>
                  <span class="post-date">{{ formatDate(post.createdAt) }}</span>
                </div>
                <p class="post-body">{{ post.body }}</p>
                <img v-if="post.imageUrl" :src="post.imageUrl" class="post-image" alt="Post Image" />
                <div class="post-actions">
                  <button
                    class="vote-button upvote"
                    :class="{ 'active-vote': getUserVoteStatus(post) === 'upvote' }"
                    @click="handleVote(post._id, 'upvote')"
                    :disabled="!userId || post.authorId._id === userId"
                  >
                    👍 {{ post.upvoteCount }}
                  </button>
                  <button
                    class="vote-button downvote"
                    :class="{ 'active-vote': getUserVoteStatus(post) === 'downvote' }"
                    @click="handleVote(post._id, 'downvote')"
                    :disabled="!userId || post.authorId._id === userId"
                  >
                    👎 {{ post.downvoteCount }}
                  </button>
                  <!-- Edit and Delete buttons are typically only for 'Your Posts' view, so they are omitted here for the general feed -->
                </div>

                <div class="comments-toggle">
                  <button @click="toggleComments(post._id)" class="show-hide-comments-button">
                    {{ showingComments[post._id] ? 'Hide Comments' : 'Show Comments' }}
                  </button>
                </div>

                <div v-if="showingComments[post._id]" class="comments-section-wrapper">
                  <div class="comments-section">
                    <h4>Comments</h4>
                    <div class="comment-create-form">
                      <textarea
                        v-model="newCommentBodies[post._id]"
                        placeholder="Add a comment..."
                        rows="3"
                        class="comment-textarea"
                      ></textarea>
                      <button
                        @click="handleCreateComment(post._id, null, newCommentBodies[post._id])"
                        class="submit-button"
                        :disabled="!newCommentBodies[post._id] || newCommentBodies[post._id].trim() === ''"
                      >
                        Add Comment
                      </button>
                    </div>
                    <div class="comment-list-container">
                      <div v-if="post.comments && post.comments.length === 0" class="no-comments-placeholder">
                        No comments yet. Be the first to comment!
                      </div>
                      <div v-else class="comments-wrapper">
                        <div v-for="comment in post.comments" :key="comment._id" class="comment-item">
                          <div class="comment-header">
                            <span class="comment-author"><strong>{{ comment.authorId.username }}</strong></span>
                            <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
                          </div>
                          <p class="comment-body">{{ comment.body }}</p>
                          <div class="comment-actions">
                            <button
                              class="vote-button upvote"
                              :class="{ 'active-vote': getUserCommentVoteStatus(comment) === 'upvote' }"
                              @click="handleCommentVote(post._id, comment._id, 'upvote')"
                              :disabled="userId === comment.authorId._id"
                            >
                              👍 {{ comment.upvoteCount }}
                            </button>
                            <button
                              class="vote-button downvote"
                              :class="{ 'active-vote': getUserCommentVoteStatus(comment) === 'downvote' }"
                              @click="handleCommentVote(post._id, comment._id, 'downvote')"
                              :disabled="userId === comment.authorId._id"
                            >
                              👎 {{ comment.downvoteCount }}
                            </button>
                            <button
                              v-if="userId === comment.authorId._id"
                              class="delete-button"
                              @click="confirmDeleteComment(post._id, comment._id, comment.replies && comment.replies.length > 0)"
                            >
                              Delete
                            </button>
                            <button
                              v-if="!comment.parentCommentId && replyingToCommentId !== comment._id"
                              class="reply-button"
                              @click="setReplyingToComment(post._id, comment._id, comment.authorId.username)"
                            >
                              Reply
                            </button>
                          </div>

                          <div v-if="replyingToCommentId === comment._id" class="reply-form-container">
                            <div class="reply-to-info">Replying to {{ replyingToCommentAuthor }}</div>
                            <textarea
                              v-model="newReplyBody"
                              placeholder="Write your reply..."
                              rows="3"
                              class="comment-textarea"
                            ></textarea>
                            <div class="reply-form-actions">
                              <button @click="handleCreateComment(post._id, comment._id, newReplyBody)" class="submit-button">
                                Submit Reply
                              </button>
                              <button @click="cancelReply" class="cancel-button">Cancel</button>
                            </div>
                          </div>

                          <div v-if="comment.replies && comment.replies.length > 0" class="comment-replies">
                            <div v-for="reply in comment.replies" :key="reply._id" class="comment-item is-reply">
                              <div class="comment-header">
                                <span class="comment-author"><strong>{{ reply.authorId.username }}</strong></span>
                                <span class="comment-date">{{ formatDate(reply.createdAt) }}</span>
                              </div>
                              <p class="comment-body">{{ reply.body }}</p>
                              <div class="comment-actions">
                                <button
                                  class="vote-button upvote"
                                  :class="{ 'active-vote': getUserCommentVoteStatus(reply) === 'upvote' }"
                                  @click="handleCommentVote(post._id, reply._id, 'upvote')"
                                  :disabled="userId === reply.authorId._id"
                                >
                                  👍 {{ reply.upvoteCount }}
                                </button>
                                <button
                                  class="vote-button downvote"
                                  :class="{ 'active-vote': getUserCommentVoteStatus(reply) === 'downvote' }"
                                  @click="handleCommentVote(post._id, reply._id, 'downvote')"
                                  :disabled="userId === reply.authorId._id"
                                >
                                  👎 {{ reply.downvoteCount }}
                                </button>
                                <button
                                  v-if="userId === reply.authorId._id"
                                  class="delete-button"
                                  @click="confirmDeleteComment(post._id, reply._id, false)"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>

    <div v-if="showEditPostModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Edit Your Post</h3>
        <p v-if="editPostError" class="error-message">{{ editPostError }}</p>
        <p v-if="editPostSuccess" class="success-message">{{ editPostSuccess }}</p>
        <form @submit.prevent="handleEditPostSubmit">
          <div class="form-group">
            <label for="editPostBody">Post Body</label>
            <textarea
              id="editPostBody"
              v-model="editPostForm.body"
              rows="6"
              class="form-textarea"
            ></textarea>
          </div>
          <div class="form-group">
            <label for="editPostImageUrl">Image URL (Optional)</label>
            <input
              id="editPostImageUrl"
              v-model="editPostForm.imageUrl"
              type="url"
              class="form-input"
            />
          </div>
          <div class="modal-buttons">
            <button type="submit" class="submit-button" :disabled="isUpdatingPost">
              {{ isUpdatingPost ? 'Saving...' : 'Save Changes' }}
            </button>
            <button type="button" class="cancel-button" @click="closeEditPostModal">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import './styles/feed.css'
import componentLogic from './scripts/PostFeed.js'; 

export default {
  mixins: [componentLogic],
};
</script>