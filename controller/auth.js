const fs = require('fs');
const fsExtra = require('fs-extra');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../model/user');
const File = require('../model/file');

exports.signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      const error = new Error('Failed signup validation');
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    const usersNumber = await User.find().countDocuments();
    if (usersNumber >= 10) {
      const error = new Error('Sorry, too much users. Please contact me: sztefkokamil@gmail.com');
      error.statusCode = 422;
      throw error;
    }

    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;

    const user = await User.findOne({ email });

    if (user) {
      const error = new Error('User with this email exist');
      error.statusCode = 409;
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
    res.status(201).json(response);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      const error = new Error('Failed login validation');
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    const email = req.body.email;
    const password = req.body.password;

    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error('Authentication failed - email not exist');
      error.statusCode = 401;
      throw error;
    }

    const isPassOk = await bcrypt.compare(password, user.password);
    if (!isPassOk) {
      const error = new Error('Authentication failed - wrong password');
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString()
      },
      process.env.JWT_LOGIN_SECRET
    );

    res.status(202).json({ token, userId: user._id.toString() });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  if (process.env.GUEST === req.userId) {
    const response = { message: "You can't delete Guest account." };
    res.status(403).json(response);
    return;
  }

  try {
    await User.findByIdAndRemove(req.userId);
    await File.deleteMany({ owner: req.userId });

    fsExtra.remove(`storage/user-${req.userId}`, err => {
      if (err) console.log(err);
    });

    const response = { message: 'User deleted' };
    res.status(202).json(response);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
