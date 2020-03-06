const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const storageController = require('../controller/storage');
const isAuth = require('../utils/isAuth');

router.get('/files', isAuth, storageController.getFiles);

router.post('/files', isAuth, storageController.uploadFiles);

router.get('/download/:id', isAuth, storageController.downloadFile);

router.put('/file', isAuth, storageController.updateFile);

router.delete('/file/:id', isAuth, [param('id').isMongoId()], storageController.deleteFile);

module.exports = router;
