const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const multer = require('multer');
const mongoose = require('mongoose');

const authRouter = require('./routes/auth');
const storageRouter = require('./routes/storage');
const errorHandler = require('./utils/errorHandler');

dotenv.config();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, `storage/user-${req.query.userid}`); },
  filename: (req, file, cb) => { cb(null, file.originalname); }
});

const app = express();

app.use('/storage', express.static(path.join(__dirname, 'storage')));
app.use(bodyParser.json());
app.use(multer({ storage: fileStorage}).any('files', 10));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(authRouter);
app.use(storageRouter);

app.use(errorHandler);

mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
.then(result => {
  app.listen(process.env.PORT, () => {
    console.log(`Listen at ${process.env.PORT}`);
  });
})
.catch(err => { throw new Error(err) });