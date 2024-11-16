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




// const User = mongoose.model('User', userModels);
// const Products = mongoose.model('Product', productSchema);
const User = mongoose.models.User || mongoose.model('User', userModels);



module.exports = { User};
