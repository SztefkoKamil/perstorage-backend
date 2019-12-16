

exports.getFiles = (req, res, next) => {
  // check authorization

  // fetch files from DB

  // send files
};

exports.uploadFile = (req, res, next) => {
  // check authorization
  
  // add file to DB

  // send response
};

exports.updateFile = (req, res, next) => {
  // check authorization

  const fileId = req.params.id;

  // find file in user's storage collection
  
  // compare fields to update

  // update file

  //send response
};

exports.deleteFile = (req, res, next) => {
  // check authorization

  const fileId = req.params.id;

  // find file in user's storage collection

  // delete file

  // send response
};