const express = require('express')
const router = express.Router();
const upload = require('../middleware/multer')
const { Admin, Product, Category, SubCategory } = require('../models/adminModels');


const { adminLogin, dashboard, createProduct, updateProduct, deleteProduct, listProducts, blockedProducts, logOut, listCategories, createCategory, updateCategory, deleteCategory, listSubCategories, createSubCategory, updateSubCategory, deleteSubCategory, listOrders, changeOrderStatus, viewOrderDetails, listReviews } = require('../controller/adminController');



router.route('/login')
    .get((req, res) => {
        res.render('admin/adminLogin', { error: "" })
    })
    .post(async (req, res) => {
        adminLogin(req, res)
    })



router.route('/dashboard')
    .get(dashboard)


router.route('/create')

    .get(async (req, res) => {
        const categories = await Category.find().populate('subCategories')
        res.render('admin/createProduct', { categories })
    })
    .post(upload.single('image'), (req, res) => {
        createProduct(req, res)
    })



router.route('/products/:productId')
    .get(async (req, res) => {
        const product = await Product.findById(req.params.productId);
        if (!product) return res.status(404).send('Product not found');

        res.render('admin/updateProduct', { Product: product });
    })
    .post(upload.single('image'), updateProduct)




router.route('/product/delete/:productId')
    .post(deleteProduct)




router.route('/products')
    .get((req, res) => {
        listProducts(req, res)
    })



router.route('/products/:productId/block')
    .post((req, res) => { blockedProducts(req, res) })


router.route('/logout')
    .get(logOut);




router.route('/categories')
    .get(async (req, res) => {
        const categories = await Category.find().populate('subCategories');
        res.render('admin/listCategories',
            { categories });
    })
    .post(createCategory);



router.route('/categories/:categoryId/edit')
    .get(async (req, res) => {
        try {

            const category = await Category.findById(req.params.categoryId);
            if (!category) {
                return res.status(404).send('Category not found');
            }

            res.render('admin/editCategory',
                { category });
        } catch (error) {
            res.status(500).send('Error fetching category for editing');
        }
    })
    .post(updateCategory);


router.route('/create-category')
    .get((req, res) => {
        res.render('admin/createCategory');
    })
    .post(createCategory);

router.route('/categories/:categoryId/delete')
    .get(deleteCategory);




router.route('/subcategories')
    .get(async (req, res) => {
        const subCategories = await SubCategory.find().populate('parentCategory', 'name');
        res.render('admin/listSubCategories', { subCategories });
    });


router.route('/create-subcategory')
    .get(async (req, res) => {
        const categories = await Category.find();
        res.render('admin/createSubCategory', { categories });
    })
    .post(createSubCategory);


router.route('/update-subcategory/:subcategoryId')
    .get(async (req, res) => {
        const { subcategoryId } = req.params;
        const subCategory = await SubCategory.findById(subcategoryId).populate('parentCategory');

        const categories = await Category.find();


        res.render('admin/updateSubCategory', { subCategory, categories });
    })

    .post(updateSubCategory);




router.route('/subcategories/:subcategoryId/delete')
    .get(deleteSubCategory)
    .post(deleteSubCategory);



router.route('/orders')
    .get(listOrders);

router.route('/orders/change-status/:orderId')
    .post(changeOrderStatus);



router.route('/orders/:orderId')
    .get(viewOrderDetails);

router.use('/reviews', listReviews);

module.exports = router