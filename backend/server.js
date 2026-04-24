require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const trendsRouter = require('./routes/trends');
const generateRouter = require('./routes/generate');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/trends', trendsRouter);
app.use('/api/generate', generateRouter);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Content Engine running on port ${PORT}`);
});
