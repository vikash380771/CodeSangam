const express = require("express");
const app = express();
const path = require("path");
const collection = require("./mongodb");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');


const templatePath = path.join(__dirname, "../tempelates"); 
const publicPath = path.join(__dirname, "../public");

const hbs = require("hbs");
app.use(express.json());
app.set("view engine", "hbs");
app.set("views", templatePath);
app.use(express.static(publicPath));
app.use(express.urlencoded({ extended: false }));

// Create a nodemailer transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "vb380771@gmail.com",
        pass: "mnio nohx sica dxoz",
    },
    secure: true,
    port: 465,
});

// Function to generate token
function generateToken() {
    // Generate a random 32-byte hexadecimal token
    return crypto.randomBytes(16).toString("hex");
}

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.post("/signup", async (req, res) => {
    try {
        const verificationToken = generateToken();
        const data = {
            email: req.body.email,
            password: req.body.password,
            verificationToken: verificationToken,
        };

        await collection.create(data);
        sendVerificationEmail(data.email, verificationToken);

        res.render("verify-email");
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).send(`Error during signup: ${error.message}`);
    }
});

function sendVerificationEmail(email, verificationToken) {
    const mailOptions = {
        from: "vb380771@gmail.com",
        to: email,
        subject: "Verify Your Email",
        text: `Click the following link to verify your email: http://localhost:3000/verify-email?token=${verificationToken}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending verification email:", error);
        } else {
            console.log("Verification email sent:", info.response);
        }
    });
}

app.get("/verify-email", async (req, res) => {
    const { token } = req.query;
    try {
        const user = await collection.findOne({ verificationToken: token });

        if(user) {
            await collection.updateOne(
                { _id: user._id },
                { $set: { isVerified: true, verificationToken: null } }
            );

            res.render("email-verified");
        } else {
            res.render("verification-failed");
        }
    } catch (error) {
        console.error("Error during email verification:", error);
        res.render("verification-failed");
    }
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    try {
        const check = await collection.findOne({ email: req.body.email });

        if (check && check.password === req.body.password) {
            if (check.isVerified) {
                res.render("main");
            } else {
                res.send("Please verify your email before logging in.");
            }
        } else {
            res.send("Wrong password or email");
        }
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).send("Error during login");
       // res.send("Error during login");
    }
});



app.get('/forgot-password', (req, res) => {
    res.render('forgot-password'); 
});

app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        // Check if the email exists in the user data store (MongoDB)
        const user = await collection.findOne({ email });

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Generate a unique token
        const token = crypto.randomBytes(20).toString('hex');

        // Store the token in the user document in MongoDB
        user.passwordResetToken = token;
        await user.save();

        // Send a password reset email
        const mailOptions = {
            from: 'vb380771@gmail.com',
            to: email,
            subject: 'Password Reset',
            text: `Click the following link to reset your password: http://localhost:3000/reset-password/${token}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).send('Error sending email');
            }

            res.status(200).send('Password reset email sent');
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});





app.get('/reset-password/:token', async (req, res) => {
    const { token } = req.params;

    try {
        // Check if the token is valid
        const user = await collection.findOne({ passwordResetToken: token });
        if (user && user.passwordResetTokenExpires > new Date()) {
            // Render the password reset form
            res.render('reset-password', { token });
        } else {
            // Token is invalid or expired
            res.render('reset-password-error');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        // Check if the token is valid
        const user = await collection.findOne({ passwordResetToken: token });

        if (!user || user.passwordResetTokenExpires <= new Date()) {
            return res.render('reset-password-error');
        }

        // Reset the password
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        
        await collection.updateOne({ _id: user._id }, { $set: user });

        res.render('password-reset-successful');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});



app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
