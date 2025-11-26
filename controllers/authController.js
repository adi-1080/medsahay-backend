import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { PatientProfile } from '../models/PatientProfile.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const buildUserResponse = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  phone_number: user.phone_number,
});

/**
 * POST /api/v1/auth/signup
 * Body: { fullName, email, password, confirmPassword, role, agreeToTerms, phone_number? }
 * Response: { access_token, user }
 */
export const signup = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      confirmPassword,
      role,
      agreeToTerms,
      phone_number,
    } = req.body;

    if (!agreeToTerms) {
      return res.status(400).json({ detail: 'You must agree to terms.' });
    }

    if (!fullName || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ detail: 'Missing required fields.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ detail: 'Passwords do not match.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ detail: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
      phone_number: phone_number || '',
    });

    // Optionally auto-create a patient profile
    if (role === 'patient') {
      await PatientProfile.create({
        user: user._id,
        full_name: fullName,
        email,
        phone_number: phone_number || '',
      });
    }

    const token = generateToken(user);

    return res.status(201).json({
      access_token: token,
      user: buildUserResponse(user),
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 * Response: { access_token, user }
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ detail: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ detail: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(401).json({ detail: 'Invalid credentials.' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      access_token: token,
      user: buildUserResponse(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ detail: 'Internal server error' });
  }
};
