const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://dev-0vug6eoa43ngvsv2.us.auth0.com'
  ],
  credentials: true
}));

app.use(express.json());

mongoose.connect('mongodb://localhost:27017/threadspace', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

app.get('/', (req, res) => res.send('ThreadSpace API is running'));

const userRoutes = require('./routes/User');
app.use('/User', userRoutes);

const spaceRoutes = require('./routes/Space');
app.use('/Space', spaceRoutes);

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const postRoutes = require('./routes/Post');
app.use('/Post', postRoutes);

const commentRoutes = require('./routes/Comment');
app.use('/Comment', commentRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});