const { Admin, Product, Category, SubCategory } = require('../models/adminModels')
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');




const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    try {

        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(400).render('admin/adminLogin', { error: "'Invalid email'" })
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(400).render('admin/adminLogin', { error: "'Invalid password'" })
        }


        res.cookie('adminInfo', JSON.stringify({ username: admin.username, email: admin.email }), {

        });

        return res.redirect('/admin/dashboard');

    } catch (error) {
        return res.status(500).json({ message: 'Error logging in', error });
    }
}


const dashboard = async (req, res) => {
    try {

        const totalProducts = await Product.countDocuments();
        const blockedProducts = await Product.countDocuments({ isBlocked: true });
        const activeProducts = await Product.countDocuments({ isBlocked: false });

        const totalCategories = await Category.countDocuments();
        const totalSubcategories = await SubCategory.countDocuments();


        res.render('admin/dashboard', {
            totalProducts,
            blockedProducts,
            activeProducts,
            totalCategories,
            totalSubcategories
        });
    } catch (error) {
        res.status(500).send("Error loading dashboard");
    }
}


const createProduct = async (req, res) => {
    const { name, description, price, category,  stock } = req.body;
    try {

        const categories = await Category.find();


        const image = req.file ? req.file.path.replace(/\\/g, "/") : '';

        const product = new Product({
            name,
            description,
            price,
            category,
            stock,
            image: image ? '/productImages/' + image.split('/').pop() : ''
        })

        await product.save()

        res.render('admin/createProduct',{categories});

    } catch (error) {
        res.status(500).json({ message: "Error creating product", error })
    }
}




const updateProduct = async (req, res) => {
    const { productId } = req.params;
    const { name, description, price, category, stock } = req.body;

    try {
        const existProduct = await Product.findById(productId);
        if (!existProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        
        let imagePath = existProduct.image; 
        if (req.file) {
            imagePath = '/productImages/' + req.file.filename; 
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            {
                name,
                description,
                price,
                category,
                stock,
                image: imagePath
            },
            { new: true } 
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found for update' });
        }

        res.redirect('/admin/products');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating product', error });
    }
};



const deleteProduct = async (req, res) => {

    const { productId } = req.params
    try {
        const product = await Product.findByIdAndDelete(productId)

        if (!product) return res.status(404).json({ message: 'Product not found' });

        const Products = await Product.find();
        res.render('admin/listProduct', { Products })
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error });
    }
}


const listProducts = async (req, res) => {

    try {
        const Products = await Product.find().populate('category', 'name');

        res.render('admin/listProduct', { Products })

    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error });
    }
};

const blockedProducts = async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId)

        if (!product) return res.status(404).send('Product not found');

        product.isBlocked = !product.isBlocked;
        await product.save();
        const Products = await Product.find();
        res.render('admin/listProduct', { Products });

    } catch (error) {
        res.status(400).json({ message: 'Error blocking/unblocking product', error })
    }
}


const logOut = (req, res) => {
    try {
        res.clearCookie('adminInfo')

        // res.status(200).json({ message: 'Logged out successfully' });

        res.redirect('/admin/login');
    } catch (error) {

        res.status(500).json({ message: 'Error logging out', error });
    }
};



const listCategories = async (req, res) => {
    try {
        const categories = await Category.find().populate('subCategories');
        res.render('admin/listCategories', { categories });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error });
    }
};


const createCategory = async (req, res) => {
    const { name } = req.body;
    try {
        const category = new Category({ name });
        await category.save();
        res.redirect('/admin/categories');
    } catch (error) {
        res.status(500).json({ message: 'Error creating category', error });
    }
};





const updateCategory = async (req, res) => {
    const { categoryId } = req.params;
    const { name } = req.body;

    try {
     
        const category = await Category.findByIdAndUpdate(categoryId, { name }, { new: true });

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

 
        res.redirect('/admin/categories');
    } catch (error) {
        res.status(500).json({ message: 'Error updating category', error });
    }
};

const deleteCategory = async (req, res) => {
    const { categoryId } = req.params;
    try {
        await Category.findByIdAndDelete(categoryId);
        res.redirect('/admin/categories');
    } catch (error) {
        res.status(500).json({ message: 'Error deleting category', error });
    }
};




const listSubCategories = async (req, res) => {
    try {
        const subCategories = await SubCategory.find()
            .populate('parentCategory', 'name'); 

        res.render('admin/listSubCategories', { subCategories });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subcategories', error });
    }
};


const createSubCategory = async (req, res) => {
    const { name, categoryId } = req.body;

    try {
       
        if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ message: "Invalid or missing category ID" });
        }

        
        const category = await Category.findById(categoryId); 
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

      
        const subCategory = new SubCategory({
            name,
            parentCategory: categoryId,  
        });

       
        await subCategory.save();

       
        category.subCategories.push(subCategory._id);
        await category.save();

   
        res.redirect('/admin/subcategories'); 
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error creating subcategory", error });
    }
};


const updateSubCategory = async (req, res) => {
    const { subcategoryId } = req.params;
    const { name, categoryId } = req.body;

    try {
      
        const subCategory = await SubCategory.findById(subcategoryId).populate('parentCategory');

        if (!subCategory) {
            return res.status(404).json({ message: "SubCategory not found" });
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        subCategory.name = name;
        subCategory.category = categoryId;
        await subCategory.save();

        res.redirect('/admin/subcategories');
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error updating subcategory", error });
    }
};





const deleteSubCategory = async (req, res) => {
    const { subcategoryId } = req.params; 

    try {
        const subCategory = await SubCategory.findByIdAndDelete(subcategoryId); 
        if (!subCategory) {
            return res.status(404).json({ message: "SubCategory not found" });
        }

        res.redirect('/admin/subcategories'); 
    } catch (error) {
        res.status(500).json({ message: "Error deleting subcategory", error });
    }
};





module.exports = {
    adminLogin,
    dashboard,
    createProduct,
    updateProduct,
    deleteProduct,
    listProducts,
    blockedProducts,
    logOut,
    
    createCategory,
    updateCategory,
    deleteCategory,
    listCategories,

    createSubCategory,
    updateSubCategory,
    deleteSubCategory,
    listSubCategories,
}







