const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

router.post('/signup', [
    body('name').not().isEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
        }

        const verificationToken = crypto.randomBytes(20).toString('hex');
        const verificationTokenExpiry = Date.now() + 3600000; // 1 hour

        user = new User({
            name,
            email,
            password,
            verificationToken,
            verificationTokenExpiry
        });

        await user.save();

        const verificationURL = `http://${req.headers.host}/api/auth/verify-email/${verificationToken}`;

        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL_FROM,
            subject: 'Email Verification',
            text: `You are receiving this because you (or someone else) have signed up for an account.\n\n
                   Please click on the following link, or paste this into your browser to complete the verification process:\n\n
                   ${verificationURL}\n\n
                   If you did not request this, please ignore this email.\n`
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Error sending email:', err);
                return res.status(500).send('Error sending email');
            }
            res.status(200).json({ msg: 'Verification email sent to your email' });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/verify-email/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            verificationToken: req.params.token,
            verificationTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: 'Email verification token is invalid or has expired' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiry = undefined;
        await user.save();
        res.status(200).json({
            status: 'success',
            message: 'Email verified successfully.',
            data: {
                verified: true,
                timestamp: new Date().toISOString()
            }
        });
        
       

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');

    }
});

router.post('/login', [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
        }

        if (!user.isVerified) {
            return res.status(400).json({ errors: [{ msg: 'Please verify your email to log in' }] });
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


router.get('/user', async (req, res) => {
    try {
        const userId = req.user.id; // Assuming JWT token is used for authentication
        const user = await User.findById(userId).select('-password'); // Exclude password field
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


module.exports = router;
