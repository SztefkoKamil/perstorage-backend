const fs = require('fs');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../model/user');


exports.signup = async (req, res, next) => {

  const errors = validationResult(req);
  if(!errors.isEmpty()){
    console.log(errors.array());
    const error = new Error('Filed signup validation');
    error.statusCode = 422;
    error.errorCode = 902;
    error.data = errors.array();
    throw error;
  }
  
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;

  try {
  const user = User.findOne({email});

  if(user) {
    const error = new Error('User with this email exist');
    error.statusCode = 409;
    error.errorCode = 922;
    throw error;
  }

  const hashedPass = await bcrypt.hash(password, 12);

  const newUser = new User({
    email,
    name,
    password: hashedPass
  });
  const savedUser = await newUser.save();
  const userId = savedUser._id.toString();

  fs.mkdirSync(`storage/user-${userId}`);

  const response = {
    id: userId,
    email: savedUser.email,
    name: savedUser.name
  };
  res.json(response);

  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    if (!err.errorCode) {
      err.errorCode = 921;
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    console.log(errors.array());
    const error = new Error('Filed login validation');
    error.statusCode = 422;
    error.errorCode = 901;
    error.data = errors.array();
    throw error;
  }

  const email = req.body.email;
  const password = req.body.password;
  
  try {
  const user = await User.findOne({email})

  if(!user) {
    const error = new Error('Authentication filed - email not exist');
    error.statusCode = 401;
    error.errorCode = 912;
    throw error;
  } 

  const isPassOk = await bcrypt.compare(password, user.password);
  if(!isPassOk) {
    const error = new Error('Authentication filed - wrong password');
    error.statusCode = 401;
    error.errorCode = 913;
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
    if (!err.errorCode) {
      err.errorCode = 911;
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

  // delete user's files from db

  // delete user's files folder from hard disk
  fs.rmdir(`storage/user-${req.userId}`, (err) => {
    console.log(err);
  });

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
    if (!err.errorCode) {
      err.errorCode = 927;
    }
    next(err);
  }
};