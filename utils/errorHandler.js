module.exports = (error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const errorCode = error.errorCode
  const message = error.message;
  const data = error.data;
  res.status(status).json({errorCode, message, data});
}