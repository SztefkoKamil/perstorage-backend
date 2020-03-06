const path = require('path');
const fs = require('fs');
const File = require('../model/file');
const User = require('../model/user');

exports.getFiles = async (req, res, next) => {
  try {
    const files = await File.find({ owner: req.userId });
    const response = [];

    for (let file of files) {
      const fileToSend = {
        id: file._id.toString(),
        type: file.type,
        name: `${file.name}.${file.ext}`
      };
      if (process.env.HOST === 'http://localhost') {
        fileToSend.path = `${process.env.HOST}:${process.env.PORT}/${file.path}`;
      } else {
        fileToSend.path = `${process.env.HOST}/${file.path}`;
      }
      response.push(fileToSend);
    }

    res.json(response);
  } catch (err) {
    console.log(err);
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.uploadFiles = async (req, res, next) => {
  const filesToResponse = [];

  try {
    const userFiles = await File.find({ owner: req.userId }, { _id: 0, name: 1, ext: 1 });
    if (userFiles.length >= 20) {
      const response = {
        message: "You can't add new files. Number of files limited to 20",
        addedFiles: []
      };
      res.status(200).json(response);
      return;
    }

    const userFilesNames = userFiles.map(i => {
      const newItem = `${i.name}.${i.ext}`;
      return newItem;
    });

    for (let i in req.files) {
      const fullName = req.files[i].originalname;
      const nameParts = fullName.split('.');
      let name, type;
      const ext = nameParts[nameParts.length - 1];
      nameParts.pop();
      if (nameParts.length > 1) {
        name = nameParts.join('.');
      } else {
        name = nameParts[0];
      }

      if (userFilesNames.includes(fullName)) continue;

      if (ext === 'jpeg' || ext === 'jpg' || ext === 'png') type = 'image';
      else if (ext === 'rar' || ext === 'zip' || ext === '7z') type = 'compressed';
      else if (ext === 'pdf' || ext === 'doc' || ext === 'docx' || ext === 'txt' || ext === 'TXT')
        type = 'document';

      const newFile = new File({
        owner: req.userId,
        type,
        name,
        ext,
        path: `storage/user-${req.userId}/${fullName}`,
        size: req.files[i].size
      });
      const savedFile = await newFile.save();

      const fileToResponse = {
        id: savedFile._id.toString(),
        type: savedFile.type,
        name: `${savedFile.name}.${savedFile.ext}`
      };
      if (process.env.HOST === 'http://localhost') {
        fileToResponse.path = `${process.env.HOST}:${process.env.PORT}/${savedFile.path}`;
      } else {
        fileToResponse.path = `${process.env.HOST}/${savedFile.path}`;
      }
      filesToResponse.push(fileToResponse);

      const user = await User.findById(req.userId);
      user.files.push(savedFile._id);
      user.save();
    }

    const filesCounter = req.files.length;
    const response = { addedFiles: filesToResponse };
    if (filesCounter === 1) {
      response.message = '1 new file added';
    } else {
      response.message = `${req.files.length} new files added`;
    }

    res.status(201).json(response);
  } catch (err) {
    console.log(err);
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.downloadFile = async (req, res, next) => {
  const fileId = req.params.id;
  const file = await File.findById(fileId);
  res.download(file.path, file.name, err => {
    if (err) console.log(err);
  });
};

exports.updateFile = async (req, res, next) => {
  const newFile = req.body;

  try {
    const file = await File.findById(newFile.id);

    const newPath = `storage/user-${req.userId}/${newFile.name}${newFile.ext}`;
    fs.renameSync(file.path, newPath);

    file.name = newFile.name;
    file.path = newPath;
    const updatedFile = await file.save();

    const response = { message: `File "${updatedFile.name}.${updatedFile.ext}" updated` };
    res.status(202).json(response);
  } catch (err) {
    console.log(err);
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.deleteFile = async (req, res, next) => {
  const fileId = req.params.id;

  try {
    const deletedFile = await File.findByIdAndRemove(fileId);

    const user = await User.findById(req.userId);
    user.files.pull(deletedFile._id);
    await user.save();

    const filePath = path.join(__dirname + '/../' + deletedFile.path);
    fs.unlink(filePath, err => {
      if (err) console.log(err);
    });

    const response = { message: `File "${deletedFile.name}.${deletedFile.ext}" deleted` };
    res.status(202).json(response);
  } catch (err) {
    console.log(err);
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};
