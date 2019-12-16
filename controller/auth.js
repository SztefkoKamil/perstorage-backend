const User = require('../model/user');

exports.signup = (req, res, next) => {
  // data validation here

  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;

  // check if user exist

  // password encryption here

  // create new User here

  // send response
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

  // send response for redirect
};