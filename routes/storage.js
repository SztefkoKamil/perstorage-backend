const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const storageController = require('../controller/storage');
const isAuth = require('../utils/isAuth');
const multerParse = require('../utils/multerParse');

router.get('/files', isAuth, storageController.getFiles);

router.post('/file', isAuth, multerParse, storageController.uploadFile);

router.put('/file/:id', isAuth, [
  param('id').isMongoId()
], storageController.updateFile);

router.delete('/file/:id', isAuth, [
  param('id').isMongoId()
], storageController.deleteFile);


module.exports = router;