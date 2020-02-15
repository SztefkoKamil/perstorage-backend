const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const authController = require('../controller/auth');
const isAuth = require('../utils/isAuth');
const User = require('../model/user');

router.post('/signup', [
  body('email').isEmail().normalizeEmail(),
  body('name').isLength({min: 2}),
  body('password').isLength({min: 6})
], authController.signup);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({min: 6})
], authController.login);

router.delete('/delete-user', isAuth, authController.delete);

module.exports = router;