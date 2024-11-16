const  { User } = require('../models/usersModels.js')
const { Admin, Product, Category, SubCategory }=require('../models/adminModels.js')
const bcrypt = require('bcryptjs');
const generateOTP = require("../middleware/otpmiddleware.js")


const registerUser = async (req, res) => {
    const { username, email, password, phone } = req.body

    try {
        const userExists = await User.findOne({ email })
        if (userExists)

            return res.status(400).render('user/register&login', {
                error: 'Email already registered',
                err: '',
                activeForm: 'register'
            });

        const usernameExists = await User.findOne({ username });
        if (usernameExists) {

            return res.status(400).render('user/register&login', {
                error: 'Username already taken',
                err: '',
                activeForm: 'register'
            });
        }

        const phoneComplexity = /^[6-9]\d{9}$/;
        if (!phoneComplexity.test(phone)) {
            return res.status(400).render('user/register&login', {
                error: 'Please enter a valid 10-digit phone number starting with digits 6-9.',
                err: "",
                activeForm: 'register'
            });
        }

        const passwordComplexity = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!passwordComplexity.test(password)) {
            return res.status(400).render('user/register&login', { error: 'Your password must include at least one uppercase letter, one lowercase letter, one digit, and one special character.', err: "", activeForm: 'register' });
        }


        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword, phone })
        await user.save();



        res.redirect('/user/login')

    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error });
    }
}

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {

        const user = await User.findOne({ email });
        if (!user) {

            return res.status(400).render('user/register&login', {
                err: 'Invalid email',
                error: '',
                activeForm: 'login'
            });

        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).render('user/register&login', {
                err: 'Invalid password',
                error: '',
                activeForm: 'login'
            });

        }

        return res.redirect('/user/products');

    } catch (error) {
        return res.status(500).json({ message: 'Error logging in', error: '', activeForm: 'login' });
    }
};


const forgetPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send("User not found");
        }

        const otp = await generateOTP(email);

        res.cookie('otp', otp).cookie('email', email).render('user/verifyotp', { error: '' })

    }
    catch (error) {
        res.status(500).send("Error sending OTP: " + error.message);
    }
}


const verifyOTP = async (req, res) => {
    const { user_otp } = req.body
    const otp = req.cookies.otp
    if (otp === user_otp) {
        return res.render('user/resetpassword', { error: '' })
    }
    else {

        return res.status(400).render('user/verifyotp', { err: 'OTP is incorrect. Please try again.' })
    }

}



async function resetPassword(req, res) {
    const { newPassword, confirmPassword } = req.body;
    const email = req.cookies.email

    if (newPassword !== confirmPassword) {
        return res.status(400).render('user/resetpassword', { error: 'Passwords do not match' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).render('user/resetpassword', { error: "User not found" });
        }

        const newpasswordComplexity = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!newpasswordComplexity.test(newPassword)) {
            return res.status(400).render('user/resetpassword', { error: 'Your password must include at least one uppercase letter, one lowercase letter, one digit, and one special character.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.updateOne({ email }, { password: hashedPassword });
        res.clearCookie('email');
        res.clearCookie('otp');

        res.status(200).json({ message: "Password reset successfully" });

    } catch (error) {
        return res.status(500).render('user/resetpassword', { error: "An error occurred while resetting the password." });
    }
}


const listProducts = async (req, res) => {
    try {
        const { name, minPrice, maxPrice } = req.query;
        let filter = {};

        if (name) {
            filter.name = new RegExp(name, 'i');
        }

        if (minPrice) {
            filter.price = { $gte: parseFloat(minPrice) };
        }

        if (maxPrice) {
            filter.price = { ...filter.price, $lte: parseFloat(maxPrice) };
        }
        const products = await Product.find(filter);
        

        res.render('user/listProduct', { products });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching products');
    }
};



const getProductDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await Products.findById(id);
        if (!product) {
            return res.status(404).send('Product not found');
        }
        res.render('user/viewProduct', { product });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching product details');
    }
};


const addToCart = async (req, res) => {
    const { id } = req.params;
    const { quantity = 1 } = req.body;

    try {
        const product = await Products.findById(id);
        if (!product) {
            return res.status(404).send('Product not found');
        }

        let cart = req.cookies.cart ? JSON.parse(req.cookies.cart) : [];

        const existingProduct = cart.find(item => item.product._id.toString() === id);

        if (existingProduct) {
            existingProduct.quantity += parseInt(quantity);
        } else {
            cart.push({
                product,
                quantity: parseInt(quantity),
            });
        }

        const total = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);

        res.cookie('cart', JSON.stringify(cart), { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        res.cookie('total', total, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

        res.redirect('/user/cart');
    } catch (error) {
        res.status(500).json({ message: 'Error adding to cart', error });
    }
};


const removeFromCart = async (req, res) => {
    const { id } = req.params;
    try {

        let cart = req.cookies.cart ? JSON.parse(req.cookies.cart) : [];


        cart = cart.filter(item => item.product._id.toString() !== id);


        const total = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);

        res.cookie('cart', JSON.stringify(cart), { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        res.cookie('total', total, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

        res.redirect('/user/cart');
    } catch (error) {
        res.status(500).json({ message: 'Error removing from cart', error });
    }
};


const clearCart = (req, res) => {
    res.clearCookie('cart');
    res.clearCookie('total');
    res.redirect('/user/cart');
};



const addToWishlist = async (req, res) => {
    try {
        const productId = req.params.id;
        const wishlist = req.cookies.wishlist ? JSON.parse(req.cookies.wishlist) : [];

        
        if (!wishlist.includes(productId)) {
            wishlist.push(productId); 
        }

       
        res.cookie('wishlist', JSON.stringify(wishlist), { httpOnly: true, maxAge: 900000 });  
        res.redirect('/user/wishlist'); 
    } catch (error) {
        res.status(500).send('Error adding to wishlist');
    }
};

const removeFromWishlist = async (req, res) => {
    try {
        const productId = req.params.id;
        let wishlist = req.cookies.wishlist ? JSON.parse(req.cookies.wishlist) : [];


        wishlist = wishlist.filter(item => item !== productId);


        res.cookie('wishlist', JSON.stringify(wishlist), { httpOnly: true, maxAge: 900000 });
        res.redirect('/user/wishlist'); 
    } catch (error) {
        res.status(500).send('Error removing from wishlist');
    }
};

const getWishlist = async (req, res) => {
    try {
        const wishlist = req.cookies.wishlist ? JSON.parse(req.cookies.wishlist) : [];
        const products = await Products.find({ '_id': { $in: wishlist } }); 

        res.render('user/wishlist', { wishlist: products });
    } catch (error) {
        res.status(500).send('Error fetching wishlist');
    }
};




module.exports = {
    registerUser,
    loginUser,
    forgetPassword,
    verifyOTP,
    resetPassword,
    listProducts,
    getProductDetails,
    addToCart,
    removeFromCart,
    clearCart,
    addToWishlist,
    removeFromWishlist,
    getWishlist
};