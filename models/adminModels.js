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
        enum: [ 'admin'],
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
        min: 0
    },
    category: {
        type: String,
        // required: true,
        trim: true
    },
    image: {
        type: String,
        // required: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
})

const Admin = mongoose.model('Admin', adminModels);
const Product = mongoose.model('Product', productSchema);
module.exports = { Admin, Product }