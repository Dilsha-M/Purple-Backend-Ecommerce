const express = require('express');
const router = express.Router()

const { registerUser, loginUser, forgetPassword, verifyOTP, resetPassword,listProducts, getProductDetails,addToCart,removeFromCart,clearCart,addToWishlist,removeFromWishlist,getWishlist} = require('../controller/userController.js')





router.route('/register')
    .get((req, res) => {
        res.render('user/register&login',{error:"",err:"",activeForm: "register"});
    })
    .post( async(req, res) => {
        registerUser(req, res)
    })



router.route('/login')
    .get((req, res) => {
        res.render('user/register&login',{err:"",error:"", activeForm: "login"})
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
        res.render('user/verifyotp',{error:""})
    })
    .post((req, res) => {
        verifyOTP(req, res)
    })



router.route('/resetpassword')
    .get((req, res) => {
        res.render('user/resetpassword',{error:""})
    })
    .post(async (req, res) => {
        resetPassword(req, res)
    })


    router.route('/products')
    .get(listProducts);

    router.route('/product/:id')
    .get(getProductDetails);


    router.route('/cart')
    .get((req, res) => {
        const cart = req.cookies.cart ? JSON.parse(req.cookies.cart) : [];
        const total = req.cookies.total || 0;
        res.render('user/cart', { cart, total });
    });

    router.route('/add-to-cart/:id')
    .post(async (req, res) => {
        await addToCart(req, res);
    });


    router.route('/remove-from-cart/:id')
    .post(async (req, res) => {
        removeFromCart(req, res);
    });


    router.route('/clear-cart')
    .post((req, res) => {
        clearCart(req, res);
    });


    router.route('/wishlist')
    .get(getWishlist);


router.route('/add-to-wishlist/:id')
.post(async (req, res) => {
    await addToWishlist(req, res);
});


router.route('/remove-from-wishlist/:id')
.post(async (req, res) => {
    removeFromWishlist(req, res);
});



module.exports = router;





