
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();  

const verifyJWT = (req, res, next) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).json({ message: 'Access Denied, No Token Provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded;  

    

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token Expired, Please Login Again' });
        }
        res.status(400).json({ message: 'Invalid Token' });
    }
};

module.exports = verifyJWT;


