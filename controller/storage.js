const File = require('../model/file');
const User = require('../model/user');


exports.getFiles = async (req, res, next) => {

  try {
  // get user files from db
  const files = await File.find({ owner: req.userId });

  const response = [];

  for(let file of files) {
    const fileToSend = {
      id: file._id.toString(),
      type: file.type,
      name: `${file.name}.${file.ext}`,
      path: `${process.env.HOST}:${process.env.PORT}/${file.path}`
    }
    response.push(fileToSend);
  }

  // send files
    res.json(response);

  } catch(err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.uploadFile = async (req, res, next) => {
  try {
    for(let i in req.files) {

    const fullName = req.files[i].originalname;
    const nameParts = fullName.split('.');
    let name, type;
    const ext = nameParts[nameParts.length-1];
    nameParts.pop();
    if(nameParts.length > 1) {
      name = nameParts.join('.');
    } else {
      name = nameParts[0];
    }

    // check file type
    if(ext === 'jpeg' || ext === 'jpg' || ext === 'png') type = 'image';
    else if(ext === 'rar' || ext === 'zip' || ext === '7z') type = 'compressed';
    else if(ext === 'pdf' || ext === 'doc' || ext === 'docx' || ext === 'txt') type = 'document';
    
    // add file to DB
    const newFile = new File({
      owner: req.userId,
      type,
      name,
      ext,
      path: `storage/user-${req.userId}/${fullName}`,
      size: req.files[i].size
    });
    const savedFile = await newFile.save();

    // add file to user's array
    const user = await User.findById(req.userId);
    user.files.push(savedFile._id);
    user.save();
    }

    // prepare response
    const filesCounter = req.files.length;
    const response = {};
    if(filesCounter === 1) {
      response.message = '1 new file added';
    } else {
      response.message = `${req.files.length} new files added`;
    }
      
    // send response
    res.status(201).json(response);

  } catch(err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }

};

exports.updateFile = async (req, res, next) => {
  // check authorization

  const fileId = req.params.id;
  const newName = req.body.name;

  try {
  // find file in user's storage collection
  const file = await File.findById(fileId);

  // update file
  file.name = newName;
  const updatedFile = await file.save();

  //send response
  const response = {
    message: `File ${updatedFile.name}.${updatedFile.ext} updated`
  }
  res.json(response);

  } catch(err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deleteFile = async (req, res, next) => {
  // check authorization

  const fileId = req.params.id;

  try {
  // delete file from Files collection
  const deletedFile = await File.findByIdAndRemove(fileId);

  // delete file from user's files array
  const user = await User.findById(req.userId);
  user.files.pull(deletedFile._id);
  const savedUser = await user.save();

  // delete file from hard disk storage

  // send response
    const response = {
      message: `File ${deletedFile.name}.${deletedFile.ext} deleted`
    }
    res.json(response);

  } catch(err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};