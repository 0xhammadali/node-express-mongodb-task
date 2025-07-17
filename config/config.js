require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set in environment, falling back to default (development only)');
  process.env.JWT_SECRET = 'devsecret'; // safe fallback for dev only
}

module.exports = {
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/roleChatDB',
  jwtSecret: process.env.JWT_SECRET,
  port: process.env.PORT || 3000,
}; 