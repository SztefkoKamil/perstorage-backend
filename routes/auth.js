const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const authController = require('../controller/auth');
const User = require('../model/user');

router.post('/signup', [
  body('email').isEmail().normalizeEmail().custom(async (email) => {
    const user = await User.findOne({email});
    return user ? new Error('User with this email alredy exist.') : true;
  }),
  body('name').isLength({min: 2}),
  body('password').isLength({min: 6})
], authController.signup);

router.post('/login', [
  body('email').isEmail().normalizeEmail().custom(async function(value) {
    const user = await User.findOne({email: value});
    return user ? true : new Error('This user don\'t exist.');
  }),
  body('password').isLength({min: 6})
], authController.login);

router.delete('/user/:id', [
  param('id').isLength({min: 24, max: 24})
], authController.delete)

module.exports = router;