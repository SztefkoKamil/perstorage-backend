const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

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


const mongoURI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@perstorage-qxol9.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(result => {
  app.listen(process.env.PORT, () => {
    console.log(`Listan at ${process.env.PORT}`);
  });
})
.catch(err => { throw new Error(err) });