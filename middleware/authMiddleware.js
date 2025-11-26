import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import "dotenv/config";

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ detail: 'Not authorized, token missing' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }

    req.user = {
      id: user._id,
      role: user.role,
      email: user.email,
    };

    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ detail: 'Not authorized, token invalid' });
  }
};