const mongoose = require('mongoose');

const userModels = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+\@.+\..+/]
  },
  phone: {
    type: Number,
    required: true,
  },

  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  isActive: {
    type: Boolean,
    default: true,
  }
},
  {
    timestamps: true
  });


  const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'Product',
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
                default: 1,
            },
        },
    ],
}, {
  timestamps: true
});


const wishlistSchema = new mongoose.Schema({
  user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true,
  },
  items: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product', 
      required: true
  }]
}, { timestamps: true });


const User = mongoose.models.User || mongoose.model('User', userModels);
const Cart = mongoose.model('Cart', cartSchema);
const Wishlist = mongoose.model('Wishlist', wishlistSchema);



module.exports = { User, Cart,Wishlist };
