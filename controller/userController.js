const User = require('../models/usersModels.js')
const bcrypt = require('bcryptjs');
const generateOTP = require("../middleware/otpmiddleware.js")


const registerUser = async (req, res) => {
    const { username, email, password } = req.body

    try {
        const userExists = await User.findOne({ email })
        if (userExists)
            return res.status(400).json({ message: 'Email already registered' })//hello this is test

        const hashedPassword = await bcrypt.hash(password, 2);

        const user = new User({ username, email, password: hashedPassword })
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error });
    }
}

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        return res.status(200).json({
            message: 'Login successful',
            user: {
                username: user.username,
                email: user.email,
                password: user.password
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error logging in', error });
    }
};


const  forgetPassword=async(req, res)=> {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send("User not found");
        }

        const otp = await generateOTP(email);

        res.cookie('otp', otp).cookie('email', email).render('verifyotp')

    }
    catch (error) {
        res.status(500).send("Error sending OTP: " + error.message);
    }
}


const verifyOTP=async(req, res)=> {
    const { user_otp } = req.body
    const otp = req.cookies.otp
    if (otp === user_otp) {
        return res.render('resetpassword')
    }
    else {
        res.status(400).send({ message: "OTP is incorrect" })
    }

}

async function resetPassword(req, res) {
    const { email, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        return res.status(400).send("Passwords do not match");
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }


        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.updateOne({ email }, { password: hashedPassword });

        res.status(200).json({ message: "Password reset successfully" });

    } catch (error) {
        res.status(500).json({ message: "An error occurred while resetting the password" });
    }
}



module.exports = { registerUser, loginUser, forgetPassword, verifyOTP, resetPassword };