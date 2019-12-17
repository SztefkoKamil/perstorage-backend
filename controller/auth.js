const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
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

exports.login = (req, res, next) => {
  // data validation here
  
  // check if user exist

  // decrypt and check password

  // create jwt token

  // send response with token
};

exports.delete = (req, res, next) => {
  // data validation here
  
  // check if user exist

  // delete user

  // delete user's storage collection

  // send response for redirect
};