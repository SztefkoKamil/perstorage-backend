const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../model/user');

exports.signup = async (req, res, next) => {

  const errors = validationResult(req);
  if(!errors.isEmpty()){
    console.log(errors.array());
    const error = new Error('Validation failed');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;

  try {
  const hashedPass = await bcrypt.hash(password, 12);

  const newUser = new User({
    email,
    name,
    password: hashedPass
  });
  const savedUser = await newUser.save();

  // add user's files collection

  const response = {
    id: savedUser._id,
    email: savedUser.email,
    name: savedUser.name
  };
  res.json(response);

  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    console.log(errors.array());
    const error = new Error('Validation failed');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const email = req.body.email;
  const password = req.body.password;
  
  try {
  const user = await User.findOne({email})

  const isPassOk = await bcrypt.compare(password, user.password);
  if(!isPassOk) {
    const error = new Error('Wrong password');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign({
    email: user.email,
    userId: user._id.toString()
  }, process.env.JWT_LOGIN_SECRET);

  res.json({ token, userId: user._id.toString()});

  } catch(err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  // data validation here
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    console.log(errors.array());
    const error = new Error('Validation failed');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  try {
  // check if user exist
  const deletedUser = await User.findByIdAndRemove(req.userId);
  console.log(deleted);

  // delete user's storage collection
  mongoose.collection(`storage-${req.userId}`).drop();

  // send response for redirect
  const response = {
    message: 'User deleted',
    userId: req.userId
  }
  res.json(response);

  } catch(err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};