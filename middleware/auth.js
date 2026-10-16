const jwt = require('jsonwebtoken');
const { wrap, httpError } = require('../utils/http');

function requireAdmin(req, res, next) {
  const token = req.cookies && req.cookies.admin_token;
  if (!token) return res.status(401).json({ error: 'Please sign in.' });
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Your session expired. Please sign in again.' });
  }
}

module.exports = { requireAdmin, wrap, httpError };
