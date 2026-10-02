const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const normalizeEmail = (email = '') => String(email || '').trim().toLowerCase();

const getEmailCandidates = (email = '') => {
    const raw = String(email || '').trim();
    const lower = raw.toLowerCase();
    return Array.from(new Set([raw, lower, raw.replace(/\s+/g, '')].filter(Boolean)));
};

const matchesLoginPassword = async (user, password) => {
    if (!user || !password) {
        return false;
    }

    if (user.passwordHash) {
        if (typeof user.passwordHash === 'string' && (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$') || user.passwordHash.startsWith('$2y$'))) {
            return await bcrypt.compare(password, user.passwordHash);
        }

        return user.passwordHash === password;
    }

    if (user.password) {
        return user.password === password;
    }

    return false;
};

const isBcryptHash = (value) => typeof value === 'string' && /^\$2[aby]\$/.test(value);

// Generate JWT Token
const generateToken = (id) => {
    const jwtSecret = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;
    return jwt.sign({ id }, jwtSecret, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user/admin
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email and password' });
        }

        const normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail.endsWith('@exelon.com')) {
            return res.status(400).json({ message: 'Employee accounts must use an @exelon.com email address' });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email: normalizedEmail,
            passwordHash,
            // Public registration can only create employee accounts.
            role: 'EMPLOYEE',
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Register user error:', error);
        res.status(500).json({ message: 'Server error while registering user' });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Check for user email
        const normalizedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: { $in: getEmailCandidates(email) } }).select('+password');

        if (user && (await matchesLoginPassword(user, password))) {
            if (!isBcryptHash(user.passwordHash)) {
                user.passwordHash = await bcrypt.hash(password, 10);
                user.password = undefined;
                await user.save();
            }

            res.json({
                token: generateToken(user._id),
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        res.status(200).json({
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                casualLeave: req.user.casualLeave,
                sickLeave: req.user.sickLeave,
                earnedLeave: req.user.earnedLeave,
            },
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    normalizeEmail,
    getEmailCandidates,
    matchesLoginPassword,
    isBcryptHash,
};



