const mongoose = require('mongoose'); 
const { User, Cart, Wishlist, Order,Review} = require('../models/usersModels.js');
const { Product, Category } = require('../models/adminModels.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const generateOTP = require("../middleware/otpmiddleware.js");
const { sendSms } = require("../middleware/smsMiddleware");
const paypal = require("../middleware/payPal.js")
// const { checkout } = require('../routes/userRoutes.js');





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

        res.cookie('auth_token', token, { httpOnly: true });


        res.redirect('/user/products');
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
};


const forgetPassword = async (req, res) => {
    const { email, phone } = req.body;

    if (!email && !phone) {
        return res.status(400).json({ error: 'Either email or phone number is required.' });
    }

    try {
        if (email) {
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ error: 'User with this email not found.' });
            }

            const otp = await generateOTP(email);
            res.cookie('otp', otp).cookie('email', email).render('user/verifyotp', { error: '' });
        } else if (phone) {
            let cleanPhone = phone.replace(/\D/g, '').trim();

            const phoneRegex = /^[6-9]\d{9}$/;
            if (!phoneRegex.test(cleanPhone)) {
                return res.status(400).json({ error: 'Invalid phone number format. Please enter a valid 10-digit phone number starting with 6-9.' });
            }

            const user = await User.findOne({ phone: cleanPhone });
            if (!user) {
                return res.status(404).json({ error: 'User with this phone number not found.' });
            }

            const otp = await sendSms(cleanPhone);
            res.cookie('otp', otp).cookie('phone', cleanPhone).render('user/verifyotp', { error: '' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error processing your request. Please try again later.' });
    }
};




const verifyOTP = async (req, res) => {
    const { user_otp } = req.body;
    const otp = req.cookies.otp;

    if (otp === user_otp) {
        return res.render('user/resetpassword', { error: '' });
    } else {
        return res.status(400).render('user/verifyotp', { error: 'OTP is incorrect. Please try again.' });
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
        const { minPrice, maxPrice, sort, category } = req.query;
        const userId = req.user?.id;

        let filter = { isBlocked: false };

        if (minPrice && maxPrice) {
            filter.price = { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) };
        } else {
            if (minPrice) filter.price = { $gte: parseFloat(minPrice) };
            if (maxPrice) filter.price = { $lte: parseFloat(maxPrice) };
        }

        if (category && category !== '') {
            filter.category = category;
        }

        let sortOptions = {};
        if (sort) {
            if (sort === 'price') {
                sortOptions.price = 1;
            } else if (sort === '-price') {
                sortOptions.price = -1;
            }
        }

        const products = await Product.find(filter).populate('category').sort(sortOptions).lean();

        const productsWithRatings = await Promise.all(
            products.map(async (product) => {
                const reviews = await Review.find({ product: product._id });
                const averageRating = reviews.length > 0
                    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
                    : '0.0';

                return { ...product, averageRating };
            })
        );

        const categories = await Category.find();

        let cartCount = 0;
        let wishlistCount = 0;

        if (userId) {
            const cart = await Cart.findOne({ user: userId }).populate('items.product');
            cartCount = cart && cart.items ? cart.items.filter(item => item.product).length : 0;

            const wishlist = await Wishlist.findOne({ user: userId }).populate('items');
            wishlistCount = wishlist ? wishlist.items.length : 0;
        }

        res.render('user/listProduct', {
            products: productsWithRatings,
            minPrice: minPrice || '',
            maxPrice: maxPrice || '',
            sort: sort || '',
            categories,
            selectedCategory: category || '',
            cartCount,
            wishlistCount,
        });
    } catch (error) {
        res.status(500).send('Error fetching products');
    }
};



const rateProduct = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;

    try {
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).send('Invalid Order ID');
        }

        const order = await Order.findOne({ _id: orderId, user: userId }).populate('items.product');
        if (!order) {
            return res.status(404).send('Order not found or you do not have permission to rate this order');
        }

        for (const item of order.items) {
            const productId = item.product._id.toString();
            const ratingField = `rating_${productId}`;
            const commentField = `comment_${productId}`;

            const rating = req.body[ratingField];
            const comment = req.body[commentField];

            if (rating && comment) {
                const review = new Review({
                    product: productId,
                    user: userId,
                    rating: parseInt(rating, 10),
                    comment: comment,
                });

                await review.save();

                const product = await Product.findById(productId);
                if (!product) {
                    console.error('Product not found:', productId);
                    continue;
                }

                product.reviews.push(review._id);
                await product.save();
            }
        }

        res.redirect('/user/orders');
    } catch (error) {
        console.error('Error submitting rating:', error);
        res.status(500).send('Error submitting rating');
    }
};





const quickBuy = async (req, res) => {
    const productId = req.params.id;
    const userId = req.user?.id;

    try {

        if (!userId) {
            return res.redirect('/user/login');
        }


        const user = await User.findById(userId);
        const product = await Product.findById(productId);


        if (!product) {
            return res.status(404).send('Product not found');
        }


        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = new Cart({
                user: userId,
                items: [{ product: productId, quantity: 1 }],
            });
            await cart.save();
        } else {

            const productIndex = cart.items.findIndex(item => item.product.toString() === productId.toString());
            if (productIndex === -1) {
                cart.items.push({ product: productId, quantity: 1 });
            } else {

                cart.items[productIndex].quantity += 1;
            }
            await cart.save();
        }


        res.redirect('/user/checkout');
    } catch (error) {
        res.status(500).send('Error processing quick buy');
    }
};



const getProductDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await Product.findById(id);
        const rating = await Review.aggregate([
            {
                $match: { product: new mongoose.Types.ObjectId(id) }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "UserDetails"
                }
            },
            {
                $unwind: "$UserDetails"
            },
            {
                $project: {
                    username: "$UserDetails.username",
                    rating: 1,
                    comment: 1
                }
            }
        ]);

        if (!product) {
            return res.status(404).send('Product not found');
        }

        res.render('user/viewProduct', { product, rating });
    } catch (error) {
        res.status(500).send('Error loading product');
    }
};




const addToCart = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).send("Unauthorized");
    }

    try {

        const product = await Product.findById(id);
        if (!product) {
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

        res.redirect('/user/cart');
    } catch (error) {
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

        const validItems = cart.items.filter(item => item.product);

        const totalPrice = validItems.reduce((sum, item) => {
            return sum + item.product.price * item.quantity;
        }, 0);

        res.render('user/cart', { cart: { items: validItems, totalPrice } });
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

        res.status(500).json({ message: 'Error updating cart', error });
    }
};


const removeFromCart = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {

            return res.status(404).send("Cart not found");
        }

        cart.items = cart.items.filter(item => item.product.toString() !== id);
        await cart.save();


        res.redirect('/user/cart');
    } catch (error) {

        res.status(500).send("Error removing product from cart");
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

        res.render('user/wishlist', { wishlist: wishlist.items });
    } catch (error) {

        res.status(500).send('Error fetching wishlist');
    }
};


const aboutPage = (req, res) => {
    res.render('user/about');
};

const logoutUser = (req, res) => {
    try {
        res.clearCookie('auth_token');

        res.redirect('/user/login');
    } catch (error) {
        res.status(500).json({ message: 'Error logging out', error });
    }
};


const viewCheckout = async (req, res) => {
    const userId = req.user?.id;
    try {
        const user = await User.findById(userId);
        const cart = await Cart.findOne({ user: userId }).populate('items.product');

        if (!cart || cart.items.length === 0) {
            return res.render('user/checkout', { cart: [], totalPrice: 0, addresses: user.addresses });
        }

        const validItems = cart.items.filter(item => item.product);

        const totalPrice = validItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

        res.render('user/checkout', { cart: { items: validItems, totalPrice }, addresses: user.addresses });
    } catch (error) {
        res.status(500).send('Error fetching cart for checkout');
    }
};



const addAddress = async (req, res) => {
    const userId = req.user.id;
    const { addressLine1, addressLine2, city, state, postalCode, country } = req.body;

    if (!addressLine1 || !city || !state || !postalCode || !country) {
        return res.status(400).send('All fields must be provided.');
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send('User not found.');
        }

        const newAddress = {
            addressLine1,
            addressLine2,
            city,
            state,
            postalCode,
            country
        };

        user.addresses.push(newAddress);
        await user.save();

        res.redirect('/user/checkout');
    } catch (error) {
        res.status(500).send('Error adding address');
    }
};


const editAddress = async (req, res) => {
    const userId = req.user.id;
    const { addressId } = req.params;
    const { addressLine1, addressLine2, city, state, postalCode, country } = req.body;

    try {

        const user = await User.findById(userId);

        const address = user.addresses.id(addressId);

        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }


        address.addressLine1 = addressLine1;
        address.addressLine2 = addressLine2 || address.addressLine2;
        address.city = city;
        address.state = state;
        address.postalCode = postalCode;
        address.country = country;


        await user.save();

        res.redirect('/user/checkout');
    } catch (error) {
        res.status(500).json({ message: 'Error updating address' });
    }
};


const deleteAddress = async (req, res) => {

    if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    const { addressId } = req.params;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }


        const addressIndex = user.addresses.findIndex(address => address.id === addressId);
        if (addressIndex === -1) {
            return res.status(404).json({ error: 'Address not found' });
        }


        user.addresses.pull({ _id: addressId });


        await user.save();

        res.redirect('/user/checkout');
    } catch (error) {
        res.status(500).json({ error: 'Error deleting address' });
    }
};




const processCheckout = async (req, res) => {
    try {
        const { shippingAddressId, paymentMethod } = req.body;

        const user = await User.findById(req.user.id);
        const cart = await Cart.findOne({ user: req.user.id })
        .populate({
            path: 'items.product',
            populate: { path: 'category', select: 'name' } 
        });
    

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: "Your cart is empty." });
        }


        const shippingAddress = user.addresses.id(shippingAddressId);

        const validPaymentMethods = ['paypal', 'cashOnDelivery'];
        if (!validPaymentMethods.includes(paymentMethod)) {
            return res.status(400).json({ error: "Invalid payment method." });
        }

        if (paymentMethod === 'cashOnDelivery') {
            let totalAmount = 0;

            cart.items.forEach(item => {
                if (item.product && item.product.price) {
                    totalAmount += item.product.price * item.quantity;
                } else {
                    return res.status(400).json({ error: "Each item must have a price." });
                }
            });


            if (totalAmount <= 0) {
                return res.status(400).json({ error: "Total amount cannot be zero or negative." });
            }

            const order = await Order.create({
                user: req.user.id,
                items: cart.items.map(item => ({
                    product: item.product._id,
                    quantity: item.quantity,
                    price: item.product.price,
                    category: item.product.category?._id,
                })),
                shippingAddress: shippingAddress,
                totalAmount: totalAmount,
                paymentMethod: paymentMethod,
                status: 'Pending',
                placedAt: new Date(),
            });


            await Cart.findByIdAndUpdate(cart._id, { items: [] });
            res.redirect('/user/order-confirmation');
        }

        else if (paymentMethod === 'paypal') {

            let totalAmount = 0;

            cart.items.forEach(item => {
                if (item.product && item.product.price) {
                    totalAmount += item.product.price * item.quantity;
                } else {
                    return res.status(400).json({ error: "Each item must have a price." });
                }
            });


            if (totalAmount <= 0) {
                return res.status(400).json({ error: "Total amount cannot be zero or negative." });
            }


            const paymentPayload = {
                intent: 'sale',
                payer: {
                    payment_method: 'paypal'
                },
                transactions: [{
                    amount: {
                        total: totalAmount.toFixed(2),
                        currency: 'USD'
                    },
                    description: 'Order payment'
                }],
                redirect_urls: {
                    return_url: `http://localhost:3000/user/order-confirmation`,
                    cancel_url: `http://localhost:3000/user/orderfailed`
                }
            };

                paypal.payment.create(paymentPayload, async (error, payment) => {
                    if (error) {
                        console.error("PayPal Error: ", error);
                        return res.status(500).json({ error: "Payment creation failed." });
                    } else {
                
                        let approvalUrl;
                        for (let i = 0; i < payment.links.length; i++) {
                            if (payment.links[i].rel === 'approval_url') {
                                approvalUrl = payment.links[i].href;
                                break;
                            }
                        }
                
                        if (!approvalUrl) {
                            return res.status(500).json({ error: "Approval URL not found." });
                        }
                
                        const order = await Order.create({
                            user: req.user.id,
                            items: cart.items.map(item => ({
                                product: item.product._id,
                                quantity: item.quantity,
                                price: item.product.price,
                                category: item.product.category?._id,
                            })),
                            shippingAddress: shippingAddress,
                            totalAmount: totalAmount,
                            paymentMethod: paymentMethod,
                            status: 'Pending',
                            paymentId: payment.id, 
                            placedAt: new Date(),
                        });
                
                        return res.redirect(approvalUrl);
                    }
                });
                
        }
    } catch (error) {
        res.status(500).json({ error: "Something went wrong." });
    }
};


const capturePayment = async (req, res) => {
    const paymentId = req.query.paymentId;
    const payerId = req.query.PayerID;

    try {
        const paymentDetails = {
            payer_id: payerId
        };

        paypal.payment.execute(paymentId, paymentDetails, async (error, payment) => {
            if (error) {
                return res.status(500).json({ error: "Payment execution failed." });
            } else {

             
                const order = await Order.findOneAndUpdate(
                    { paymentId: paymentId }, 
                    { status: 'Paid' }, 
                    { new: true }
                );

                if (!order) {
                    return res.status(404).json({ error: "Order not found for this payment." });
                }

              
                await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    
                res.redirect('/user/order-confirmation');
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Payment processing failed." });
    }
};


const orderConfirmation = async (req, res) => {
    const userId = req.user.id;
    try {

        const order = await Order.findOne({ user: userId }).sort({ createdAt: -1 })
            .populate('items.product')
            .populate('shippingAddress')

        if (!order) {
            return res.status(404).send('Order not found');
        }

        res.render('user/orderConfirmation', { order });
    } catch (error) {
        res.status(500).send('Error fetching order confirmation details');
    }
};


const viewOrders = async (req, res) => {
    const userId = req.user.id;

    try {

        const orders = await Order.find({ user: userId })
            .sort({ createdAt: -1 })
            .populate('items.product')
            .populate('shippingAddress')
        orders.forEach(order => {
            if (order.placedAt && !(order.placedAt instanceof Date)) {
                order.placedAt = new Date(order.placedAt);
            }
        });

        res.render('user/viewOrders', { orders });
    } catch (error) {
        res.status(500).send('Error fetching orders');
    }
};


const viewOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;


        const order = await Order.findById(orderId)
            .populate('items.product')
            .exec();

        if (!order) {
            return res.status(404).render('user/error', { error: "Order not found" });
        }

        res.render('user/orderDetails', { order });

    } catch (error) {
        res.status(500).render('user/error', { error: "An error occurred while fetching the order details." });
    }
};


const cancelOrder = async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).send('Order not found');
        }

        if (order.status !== 'Pending') {
            return res.status(400).send('You can only cancel orders that are "Pending"');
        }

        order.status = 'Cancelled';
        await order.save();

        res.redirect('/user/orders');
    } catch (error) {
        res.status(500).send('Error canceling order');
    }
};




module.exports = {
    registerUser,
    loginUser,
    forgetPassword,
    verifyOTP,
    resetPassword,

    listProducts,
    rateProduct,
    quickBuy,
    getProductDetails,
    addToCart,
    getCart,
    updateCart,
    removeFromCart,
    addToWishlist,
    removeFromWishlist,
    getWishlist,

    aboutPage,
    logoutUser,

    viewCheckout,
    capturePayment,
    processCheckout,
    addAddress,
    editAddress,
    deleteAddress,
    orderConfirmation,
    viewOrders,
    viewOrderDetails,
    cancelOrder,
};















