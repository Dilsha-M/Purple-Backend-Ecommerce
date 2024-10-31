const { Admin, Product } = require('../models/adminModels')
const bcrypt = require('bcryptjs');




const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    try {

        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(400).json({ message: 'Invalid email or password' })
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        res.cookie('adminInfo', JSON.stringify({ username: admin.username, email: admin.email }), {

        });

        return res.redirect('/admin/dashboard');

    } catch (error) {
        return res.status(500).json({ message: 'Error logging in', error });
    }
}


const dashBorad=async(req,res)=>{
    try {
        // Calculate stats
        const totalProducts = await Product.countDocuments();
        const blockedProducts = await Product.countDocuments({ isBlocked: true });
        const activeProducts = await Product.countDocuments({ isBlocked: false });

        // Render dashboard with data
        res.render('admin/dashboard', {
            totalProducts,
            blockedProducts,
            activeProducts
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).send("Error loading dashboard");
    }
}


const createProduct = async (req, res) => {
    const { name, description, price } = req.body;
    try {
        const image = req.file ? req.file.path : '';

        const product = new Product({ name, description, price, image })

        await product.save()

        res.status(201).json({ message: "Product created successfully", product })

    } catch (error) {
        res.status(500).json({ message: "Error creating product", error })
    }
}



const updateProduct = async (req, res) => {
    const { productId } = req.params;
    const updates = req.body

    if (req.file) updates.image = req.file.path;

    try {

        const product = await Product.findByIdAndUpdate(productId, updates,{new:true})


        if (!product) {
            return res.status(404).json({ message: "Product not found" })
        }

        // res.status(200).json({ message: "Product updated successfully", product }) 
        res.redirect('/admin/product');


    } catch (error) {
        res.status(500).json({ message: 'Error updating product', error });
    }
}



const deleteProduct = async (req, res) => {

    const { productId } = req.params

    try {
        const product = await Product.findByIdAndDelete(productId)

        if (!product) return res.status(404).json({ message: 'Product not found' });

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error });
    }
}


const listProducts = async (req, res) => {

    try {
        const Products = await Product.find();

        res.render('admin/listProduct',{Products})

    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error });
    }
};



const logOut = (req, res) => {
    try {
            res.clearCookie('adminInfo')

            res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        
        res.status(500).json({ message: 'Error logging out', error });
    }
};






module.exports = { adminLogin,dashBorad, createProduct, updateProduct, deleteProduct, listProducts,logOut }