const express = require('express');
const router = express.Router()

const { registerUser, loginUser, forgetPassword, verifyOTP, resetPassword } = require('../controller/userController.js')


// router.post('/register', async (req, res) => {
//     registerUser(req,res)
// })
// router.get('/register', (req, res) => {
//     res.render('register');
// });


router.route('/register')
    .get((req, res) => {
        res.render('user/register');
    })
    .post( async(req, res) => {
        registerUser(req, res)
    })



router.route('/login')
    .get((req, res) => {
        res.render('user/login')
    })
    .post(async (req, res) => {
        loginUser(req, res)
    })



router.route('/forgetpassword')
    .get((req, res) => {
        res.render('user/forget-password')
    })
    .post(async (req, res) => {
        forgetPassword(req, res)
    })


router.route('/verifyotp')
    .get((req, res) => {
        res.render('user/verifyotp')
    })
    .post((req, res) => {
        verifyOTP(req, res)
    })



router.route('/resetpassword')
    .get((req, res) => {
        res.render('user/resetpassword')
    })
    .post(async (req, res) => {
        resetPassword(req, res)
    })

module.exports = router;





