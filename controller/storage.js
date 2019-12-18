const File = require('../model/file');
const User = require('../model/user');


exports.getFiles = async (req, res, next) => {
  // get user files from db

  // send files
};

exports.uploadFile = async (req, res, next) => {
  // check authorization

  // to delete in future
  req.files = req.body.files;
  
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
    else if(ext === 'rar' || ext === 'zip') type = 'compressed';
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

    // add file to hard disk storage

    }

    // send response
    const response = {
      message: `${req.files.length} new files added`
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

exports.updateFile = (req, res, next) => {
  // check authorization

  const fileId = req.params.id;

  // find file in user's storage collection
  
  // compare fields to update

  // update file

  //send response
};

exports.deleteFile = async (req, res, next) => {
  // check authorization

  // delete file from Files collection

  // delete file from user's files array

  // delete file from hard disk storage

  // send response
};