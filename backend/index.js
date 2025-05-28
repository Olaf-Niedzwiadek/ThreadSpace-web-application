const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Example route
app.get('/', (req, res) => res.send('ThreadSpace API is running'));

app.get('/posts', (req, res) => {
  res.json([
    { _id: '1', title: 'First test post' },
    { _id: '2', title: 'Second test post' }
  ])
});

app.listen(3001, () => console.log('Server on http://localhost:3001'));