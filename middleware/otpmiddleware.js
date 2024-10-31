const nodemailer = require('nodemailer');

function getRandomNumber() {
    const randomNumber = Math.floor(Math.random() * 9000) + 1000;
    return randomNumber;
}


async function generateOTP(email) {

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_ID,
            pass: process.env.GMAIL_PASS
        }
    });

    const otp = getRandomNumber()

    const mailOptions = {
        from: process.env.GMAIL_ID,
        to: email,
        subject: `Your OTP ${otp}`,
        text: `Dear User,

To complete your recent request, please use the following One-Time Password (OTP):
${otp}

This code is valid for the next 10 minutes. For security reasons, please do not share this OTP with anyone.

If you did not request this code, please disregard this email or contact our support team.

Thank you for helping us keep your account secure.

`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log('Error: ', error);
        }

    });
    return otp;
}



module.exports = generateOTP