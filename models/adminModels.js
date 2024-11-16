const mongoose = require('mongoose')

const adminModels = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 50,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address'],
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    role: {
        type: String,
        enum: ['admin'],
        default: 'admin'
    }
}, {
    timestamps: true
})

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        maxlength: 500
    },
    price: {
        type: Number,
        required: true,
        min: [0.01, 'Price must be greater than zero'],
        validate: {
            validator: function (value) {

                return value <= 1000000;
            },
            message: 'Price should not exceed 1,000,000'
        }
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Category",
        required: true,
        trim: true
    },
    image: {
        type: [String],
        required: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        max: [9999, 'Stock cannot exceed 1000']

    }
}, {
    timestamps: true
})


const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    subCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory'
    }]
});

const subCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    }
}, {
    timestamps: true
});






const Admin = mongoose.model('Admin', adminModels);
const Product = mongoose.model('Product', productSchema);
const Category = mongoose.model('Category', categorySchema)
const SubCategory = mongoose.model('SubCategory', subCategorySchema)


module.exports = { Admin, Product, Category, SubCategory, }