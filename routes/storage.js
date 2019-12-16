const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const storageController = require('../controller/storage');

router.get('/files', storageController.getFiles);

router.post('/file', storageController.uploadFile);

router.put('/file/:id', [
  param('id').isMongoId()
], storageController.updateFile);

router.delete('/file/:id', [
  param('id').isMongoId()
], storageController.deleteFile);


module.exports = router;