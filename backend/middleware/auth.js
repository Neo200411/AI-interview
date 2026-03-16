const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  // Extract the token from the Authorization header (format: "Bearer <token>")
  const authHeader = req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the token using process.env.JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach the decoded payload to req.user
    req.user = decoded;
    
    next();
  } catch (error) {
    // If token is invalid or expired
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = auth;
