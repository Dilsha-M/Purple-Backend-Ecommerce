const express = require('express');
const router = express.Router()


const { registerUser, loginUser, forgetPassword, verifyOTP, resetPassword, listProducts, rateProduct, quickBuy, getProductDetails, addToCart, updateCart, getCart, removeFromCart, addToWishlist, removeFromWishlist, getWishlist, aboutPage, logoutUser, viewCheckout, processCheckout, capturePayment, addAddress, editAddress, deleteAddress, orderConfirmation, viewOrders, viewOrderDetails, cancelOrder,} = require('../controller/userController.js')

const verifyJWT = require('../middleware/jwtMiddleware.js');
const { Product } = require('../models/adminModels.js');
const { Cart, User } = require('../models/usersModels.js');
const { jwt } = require('twilio');




router.route('/register')
    .get((req, res) => {
        res.render('user/register&login', { error: "", err: "", activeForm: "register" });
    })
    .post(async (req, res) => {
        registerUser(req, res)
    })



router.route('/login')
    .get((req, res) => {
        res.render('user/register&login', { err: "", error: "", activeForm: "login" })
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
        res.render('user/verifyotp', { error: "" })
    })
    .post((req, res) => {
        verifyOTP(req, res)
    })



router.route('/resetpassword')
    .get((req, res) => {
        res.render('user/resetpassword', { error: "" })
    })
    .post(async (req, res) => {
        resetPassword(req, res)
    })



router.route('/products')
    .get(verifyJWT, listProducts);



router.route('/rate-product/:orderId')
    .post(verifyJWT, rateProduct);



router.post('/checkout/quick-buy/:id', verifyJWT, async (req, res) => {
    await quickBuy(req, res);
});



router.route('/product/:id')
    .get(verifyJWT, getProductDetails);



router.route('/cart')
    .get(verifyJWT, (req, res) => {
        getCart(req, res)
    });

router.route('/add-to-cart/:id')
    .post(verifyJWT, async (req, res) => {
        await addToCart(req, res);
    });




router.route('/cart/update-cart/:id')
    .post(verifyJWT, async (req, res) => {
        await updateCart(req, res);
    });


router.route('/remove-from-cart/:id')
    .post(verifyJWT, async (req, res) => {
        await removeFromCart(req, res);
    });






router.route('/wishlist')
    .get(verifyJWT, getWishlist);


router.route('/add-to-wishlist/:id')
    .post(verifyJWT, addToWishlist);


router.route('/remove-from-wishlist/:id')
    .post(verifyJWT, removeFromWishlist);


router.get('/about', aboutPage);

router.get('/logout', logoutUser);




router.route('/checkout')
    .get(verifyJWT, viewCheckout);

router.route("/orderfailed")
    .get(verifyJWT, (req, res) => {
        res.render("user/paymentError")
    })

router.get('/checkout/success', capturePayment);

router.route('/checkout/add-address')
    .post(verifyJWT, addAddress);


router.post('/checkout/edit-address/:addressId', verifyJWT, editAddress);

router.post('/checkout/delete-address/:addressId', verifyJWT, deleteAddress);






router.route('/checkout/process')
    .post(verifyJWT, processCheckout);

router.route('/order-confirmation')
    .get(verifyJWT, orderConfirmation);

router.route('/orders')
    .get(verifyJWT, viewOrders)


router.route('/orders/:id')
    .get(verifyJWT, viewOrderDetails);



router.post('/orders/:orderId/cancel', cancelOrder);







module.exports = router;





