
const { User,Cart,Wishlist } = require('../models/usersModels.js');
const { Product } = require('../models/adminModels.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generateOTP = require("../middleware/otpmiddleware.js");


const registerUser = async (req, res) => {
    const { username, email, password, phone } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).render('user/register&login', {
                error: 'Email already registered',
                err: '',
                activeForm: 'register',
            });
        }

        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(400).render('user/register&login', {
                error: 'Username already taken',
                err: '',
                activeForm: 'register',
            });
        }

        let cleanPhone = phone.replace(/\D/g, '').trim();  
        const phoneRegex = /^[6-9]\d{9}$/; 
        if (!phoneRegex.test(cleanPhone)) {
            return res.status(400).render('user/register&login', {
                error: 'Please enter a valid 10-digit phone number starting with digits 6-9.',
                err: '',
                activeForm: 'register',
            });
        }


        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).render('user/register&login', {
                error: 'Your password must include at least one uppercase letter, one lowercase letter, one digit, and one special character.',
                err: '',
                activeForm: 'register',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword, phone });
        await user.save();

        res.redirect('/user/login');
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error });
    }
};


const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).render('user/register&login', {
                err: 'Invalid email',
                error: '',
                activeForm: 'login',
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).render('user/register&login', {
                err: 'Invalid password',
                error: '',
                activeForm: 'login',
            });
        }

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

        res.cookie('auth_token', token, { httpOnly: true});


        res.redirect('/user/products');
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
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
        res.cookie('otp', otp).cookie('email', email).render('user/verifyotp', { error: '' });
    } catch (error) {
        res.status(500).send("Error sending OTP: " + error.message);
    }
};

const verifyOTP = async (req, res) => {
    const { user_otp } = req.body;
    const otp = req.cookies.otp;

    if (otp === user_otp) {
        return res.render('user/resetpassword', { error: '' });
    } else {
        return res.status(400).render('user/verifyotp', { err: 'OTP is incorrect. Please try again.' });
    }
};

const resetPassword = async (req, res) => {
    const { newPassword, confirmPassword } = req.body;
    const email = req.cookies.email;

    if (newPassword !== confirmPassword) {
        return res.status(400).render('user/resetpassword', { error: 'Passwords do not match' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).render('user/resetpassword', { error: "User not found" });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).render('user/resetpassword', {
                error: 'Your password must include at least one uppercase letter, one lowercase letter, one digit, and one special character.',
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updateOne({ email }, { password: hashedPassword });

        res.clearCookie('email');
        res.clearCookie('otp');

        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        res.status(500).render('user/resetpassword', { error: "An error occurred while resetting the password." });
    }
};


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
        const product = await Product.findById(id);
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
    const userId = req.user?.id; 

    if (!userId) {
        return res.status(401).send("Unauthorized");
    }

    try {
        
        console.log("Adding to cart - Product ID:", id, "User ID:", userId);

        
        const product = await Product.findById(id);
        if (!product) {
            console.log("Product not found");
            return res.status(404).send("Product not found");
        }

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }


        const existingProductIndex = cart.items.findIndex(item =>
            item.product.toString() === id
        );

        if (existingProductIndex !== -1) {
           
            cart.items[existingProductIndex].quantity += 1;
        } else {
           
            cart.items.push({
                product: id,
                quantity: 1,
            });
        }


        await cart.save();
        console.log("Cart updated successfully");

        res.redirect('/user/cart'); 
    } catch (error) {
        console.error("Error adding product to cart:", error);
        res.status(500).send("Error adding product to cart");
    }
};

const getCart = async (req, res) => {
    const userId = req.user?.id; 
 

    try {
       
        const cart = await Cart.findOne({ user: userId }).populate('items.product');

        if (!cart || cart.items.length === 0) {
          
            return res.render('user/cart', { cart: [], total: 0 });
        }

    
        const total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

       
        res.render('user/cart', { cart });
    } catch (error) {
      
        res.status(500).send("Error fetching cart");
    }
};






const updateCart = async (req, res) => {
    const { id } = req.params; 
    const { quantity } = req.body;
    const userId = req.user.id;

    try {
       
        if (isNaN(quantity) || quantity <= 0) {
            return res.status(400).send("Invalid quantity.");
        }

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).send("Cart not found");
        }

        const itemIndex = cart.items.findIndex(item => item.product.toString() === id);
        if (itemIndex === -1) {
            return res.status(404).send("Product not found in cart");
        }


        cart.items[itemIndex].quantity = parseInt(quantity, 10);


        await cart.save();

        res.redirect('/user/cart');
    } catch (error) {
        console.error("Error updating cart:", error);
        res.status(500).json({ message: 'Error updating cart', error });
    }
};


const removeFromCart = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id; 
    try {
        console.log("Removing product from cart:", { productId: id, userId });

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            console.log("Cart not found");
            return res.status(404).send("Cart not found");
        }

        cart.items = cart.items.filter(item => item.product.toString() !== id);
        await cart.save();

        console.log("Product removed from cart successfully");
        res.redirect('/user/cart'); 
    } catch (error) {
        console.error("Error removing product from cart:", error);
        res.status(500).send("Error removing product from cart");
    }
};




const clearCart = async (req, res) => {
    const userId = req.user.id;

    try {
   
        await Cart.findOneAndDelete({ user: userId });

        res.redirect('/user/cart'); 
    } catch (error) {
        console.error("Error clearing cart:", error);
        res.status(500).send("Error clearing cart");
    }
};

const addToWishlist = async (req, res) => {
    const productId = req.params.id;
    const userId = req.user.id; 

    try {
   
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send('Product not found');
        }

     
        let wishlist = await Wishlist.findOne({ user: userId });


        if (!wishlist) {
            wishlist = new Wishlist({ user: userId, items: [] });
        }

   
        if (!wishlist.items.includes(productId)) {
            wishlist.items.push(productId);
        }

      
        await wishlist.save();

        res.redirect('/user/wishlist'); 
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        res.status(500).send('Error adding to wishlist');
    }
};


const removeFromWishlist = async (req, res) => {
    const productId = req.params.id;
    const userId = req.user.id; 

    try {
   
        let wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            return res.status(404).send('Wishlist not found');
        }

        wishlist.items = wishlist.items.filter(item => item.toString() !== productId);

      
        await wishlist.save();

        res.redirect('/user/wishlist'); 
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        res.status(500).send('Error removing from wishlist');
    }
};

const getWishlist = async (req, res) => {
    const userId = req.user.id;
    try {
      
        const wishlist = await Wishlist.findOne({ user: userId }).populate('items');

        if (!wishlist || wishlist.items.length === 0) {
            return res.render('user/wishlist', { wishlist: [] }); 
        }

        res.render('user/wishlist', { wishlist: wishlist.items }); // Render wishlist with product details
    } catch (error) {
        console.error("Error fetching wishlist:", error);
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
    getCart,
    updateCart,
    removeFromCart,
    clearCart,
    addToWishlist,
    removeFromWishlist,
    getWishlist,
};














