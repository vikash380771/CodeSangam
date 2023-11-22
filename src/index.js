const express = require("express");
const app = express();
const path = require("path");
const collection = require("./mongodb");

const crypto = require("crypto");
const nodemailer = require("nodemailer");

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
    secure: true, // Use SSL
    port: 465,     // SSL port
});

// function to generate token
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
        const verificationToken = generateToken(); // Generate token here
        const data = {
            email: req.body.email,
            password: req.body.password,
            verificationToken: verificationToken,
        };

        await collection.create(data);

        // Send verification email
        sendVerificationEmail(data.email, verificationToken);

        res.render("verify-email");
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).send(`Error during signup: ${error.message}`);
    }
});

// create function to send verification email
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

        if (user) {
            // Mark the user as verified
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
        res.send("Error during login");
    }
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

app.get("/logout", (req, res) => {
    res.render("home");
});
