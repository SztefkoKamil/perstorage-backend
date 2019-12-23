const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');

  if (!authHeader) {
    const error = new Error('Authorization filed - no token');
    error.statusCode = 401;
    error.errorCode = 900;
    throw error;
  }

  const token = authHeader.split(' ')[1];
  let decodedToken;

  try {
    decodedToken = jwt.verify(token, process.env.JWT_LOGIN_SECRET);
  } catch (err) {
    err.statusCode = 401;
    err.errorCode = 901;
    throw err;
  }

  if (!decodedToken) {
    const error = new Error('Authorization filed - bad token');
    error.statusCode = 401;
    error.errorCode = 901;
    throw error;
  }

  req.userId = decodedToken.userId;
  next();
}

