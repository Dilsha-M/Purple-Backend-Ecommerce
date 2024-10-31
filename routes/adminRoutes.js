const express=require('express')
const router =express.Router();
const upload=require('../middleware/multer')


const { adminLogin,dashBorad,createProduct,updateProduct,deleteProduct,listProducts,logOut}=require('../controller/adminController');
const { Product } = require('../models/adminModels');



router.route('/login')
.get((req,res)=>{
    res.render('admin/adminLogin')
})
.post(async (req,res)=>{
    adminLogin(req,res)
})



router.route('/dashboard')
.get(dashBorad)


router.route('/create')
.get((req,res)=>{
    res.render('admin/createProduct')
})
.post(upload.single('image'),(req,res)=>{
    createProduct(req,res)
})



// router.route('/product/:productId')
// .get((req,res)=>{
//     res.render('admin/updateProduct',{Product})
// })
// .put(upload.single('image'), async (req,res)=>{
//     updateProduct(req,res)
// })
// .delete(deleteProduct)




router.route('/products/:productId')
    .get(async (req, res) => {
        const product = await Product.findById(req.params.productId);
        if (!product) return res.status(404).send('Product not found');
        res.render('admin/updateProduct', { Product: product });
    })
    .put(upload.single('image'), updateProduct) // Handle PUT requests for updating
    .delete(deleteProduct); // Handle DELETE requests for deleting





router.route('/product/:productId')
.delete(async (req,res)=>{
    deleteProduct(req,res)
})





router.route('/products')
.get((req,res)=>{
    listProducts(req,res)
})
// .post(async (req,res)=>{
//     listProducts(req,res)
// })

router.route('/logout')
.get(logOut);



module.exports=router