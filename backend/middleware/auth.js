import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const secret = process.env.JWT_SECRET;
      if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('FATAL ERROR: JWT_SECRET is not defined in production');
      }
      const decoded = jwt.verify(token, secret || 'suvidha_secret');
      
      req.user = decoded; // Attach user payload (id, role, etc) to req
      next();
    } catch (error) {
      console.error('JWT verify error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

// Middleware to restrict access based on roles (e.g., admin only)
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: User role '${req.user?.role || 'Guest'}' is not authorized to access this resource` 
      });
    }
    next();
  };
};
