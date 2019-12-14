const express = require('express');
const router = express.Router();
const storageController = require('../controller/storage');

router.get('/files', storageController.getFiles);

router.post('/file', storageController.uploadFile);

router.put('/file', storageController.updateFile);

router.delete('/file', storageController.deleteFile);


module.exports = router;