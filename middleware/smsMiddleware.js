const twilio = require('twilio');


const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);


const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
};


const sendSms = async (to) => {

    let phoneNumber = to.replace(/\D/g, '').trim();  

    let countryCode = '+91'; 
    if (phoneNumber.length === 10) {
       
        phoneNumber = countryCode + phoneNumber;
    } else {
        
        throw new Error('Phone number format is not recognized or supported.');
    }

   
    const otp = generateOTP();
    const message = `Your OTP code is: ${otp}`;

    try {
   
        if (!phoneNumber.startsWith('+')) {
            throw new Error('Phone number must be in E.164 format, starting with "+" and the country code.');
        }

        const sentMessage = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER, 
            to: phoneNumber, 
        });

        console.log('OTP sent successfully:', sentMessage.sid);

       
        return otp; // Return the OTP for use in further steps (e.g., verification)
    } catch (error) {
        console.error('Error sending message:', error);
        throw new Error('Error sending SMS');
    }
};

module.exports = { sendSms };
