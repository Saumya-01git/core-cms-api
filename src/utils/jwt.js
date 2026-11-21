const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Generate Access Token
 * @param {object} payload 
 * @returns {string} JWT Token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
};

/**
 * Generate Refresh Token (longer lived, e.g. 30 days)
 * @param {object} payload 
 * @returns {string} JWT Refresh Token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: '30d'
  });
};

/**
 * Verify JWT Token
 * @param {string} token 
 * @returns {object} Decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken
};
