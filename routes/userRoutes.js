const express = require('express');
const router = express.Router()


const { registerUser, loginUser, forgetPassword, verifyOTP, resetPassword,listProducts, getProductDetails,addToCart,updateCart,getCart,removeFromCart,clearCart,addToWishlist,removeFromWishlist,getWishlist} = require('../controller/userController.js')

const verifyJWT = require('../middleware/jwtMiddleware.js');
const { Product } = require('../models/adminModels.js');
const { Cart, User } = require('../models/usersModels.js');




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

//////////////////

router.route('/products')
    .get(verifyJWT, listProducts);

router.route('/product/:id')
    .get(verifyJWT, getProductDetails);

router.route('/cart')
    .get(verifyJWT, (req, res) => {
        const user_id=req.user.id
        console.log(user_id);
        
       const cart=User.findOne({user:user_id}).populate('items.product')

        res.render('user/cart', {cart});
    });

router.route('/add-to-cart/:id')
    .post(verifyJWT, async (req, res) => {
        await addToCart(req, res);
    });

  


router.route('/update-cart/:id')
    .post(verifyJWT, async (req, res) => {
        await updateCart(req, res);
    });

router.route('/remove-from-cart/:id')
    .post(verifyJWT, async (req, res) => {
        removeFromCart(req, res);
    });

router.route('/clear-cart')
    .post(verifyJWT, (req, res) => {
        clearCart(req, res);
    });




router.route('/wishlist')
    .get(verifyJWT, getWishlist); 


router.route('/add-to-wishlist/:id')
    .post(verifyJWT, addToWishlist); 


router.route('/remove-from-wishlist/:id')
    .post(verifyJWT, removeFromWishlist); 



module.exports = router;





