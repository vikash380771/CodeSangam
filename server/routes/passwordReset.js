const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
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

router.post('/forgot-password', [
    body('email').isEmail().withMessage('Please include a valid email')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ errors: [{ msg: 'User does not exist' }] });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiry = resetTokenExpiry;
        await user.save();

        const resetURL = `http://${req.headers.host}/api/password-reset/reset/${resetToken}`;

        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL_FROM,
            subject: 'Password Reset',
            text: `You are receiving this because you (or someone else) have requested to reset the password for your account.\n\n
                   Please click on the following link, or paste this into your browser to complete the process:\n\n
                   ${resetURL}\n\n
                   If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Error sending email:', err);
                return res.status(500).send('Error sending email');
            }
            res.status(200).json({ msg: 'Password reset link sent to your email' });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/reset/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: 'Password reset token is invalid or has expired' });
        }

        res.status(200).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset Password</title>
                <style>
                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                    }
            
                    body {
                        font-family: 'Roboto', sans-serif;
                        background-color: #e9ecef;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }
            
                    .wrapper {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        width: 100%;
                        padding: 20px;
                    }
            
                    .card {
                        background: #ffffff;
                        padding: 20px;
                        border-radius: 12px;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                        max-width: 400px;
                        width: 100%;
                        text-align: center;
                    }
            
                    h1 {
                        font-size: 26px;
                        color: #333;
                        margin-bottom: 15px;
                    }
            
                    p {
                        font-size: 16px;
                        color: #666;
                        margin-bottom: 20px;
                    }
            
                    label {
                        font-size: 14px;
                        color: #555;
                        display: block;
                        margin-bottom: 8px;
                        text-align: left;
                    }
            
                    input[type="password"] {
                        width: 100%;
                        padding: 12px;
                        margin-bottom: 15px;
                        border: 1px solid #ccc;
                        border-radius: 8px;
                        font-size: 16px;
                    }
            
                    button {
                        width: 100%;
                        padding: 12px;
                        background-color: #007bff;
                        color: #ffffff;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        cursor: pointer;
                        transition: background-color 0.3s;
                    }
            
                    button:hover {
                        background-color: #0056b3;
                    }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="card">
                        <h1>Reset Password</h1>
                        <p>Please enter your new password.</p>
                        <form action="/api/password-reset/reset-password" method="POST">
                            <input type="hidden" name="token" value="${req.params.token}" />
                            <label for="password">New Password</label>
                            <input type="password" id="password" name="password" placeholder="Enter new password" required />
                            <button type="submit">Reset Password</button>
                        </form>
                    </div>
                </div>
            </body>
            </html>
            `);
            
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.post('/reset-password', [
    body('token').not().isEmpty().withMessage('Token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    try {
        let user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ errors: [{ msg: 'Password reset token is invalid or has expired' }] });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiry = undefined;
        await user.save();

        res.status(200).json({ msg: 'Password has been reset' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
