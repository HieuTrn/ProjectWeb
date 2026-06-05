const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [
        {
            masp: {
                type: String,
                required: true
            },
            soluong: {
                type: Number,
                required: true,
                min: 1,
                default: 1
            },
            date: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, {
    timestamps: true
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
