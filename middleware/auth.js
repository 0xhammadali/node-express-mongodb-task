const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/config');

module.exports = function (req, res, next) {
  const authHeader = req.header('Authorization');
  console.log('Authorization header:', authHeader);

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null;

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT verification failed', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
}; 