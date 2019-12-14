const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

const authRouter = require('./routes/auth');
const storageRouter = require('./routes/storage');

dotenv.config();

const app = express();

app.use('/storage', express.static(path.join(__dirname, 'storage')));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(authRouter);
app.use(storageRouter);

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({message, data});
});

app.listen(process.env.PORT, () => {
  console.log(`Listan at ${process.env.PORT}`);
});