const mongoose = require('mongoose');

// Định nghĩa Schema khuyến mãi (promo) của sản phẩm
const promoSchema = new mongoose.Schema({
    name: { type: String, default: '' },
    value: { type: String, default: '' }
}, { _id: false });

// Định nghĩa Schema chi tiết kỹ thuật (detail) của sản phẩm
const detailSchema = new mongoose.Schema({
    screen: { type: String, default: '' },
    os: { type: String, default: '' },
    camara: { type: String, default: '' },
    camaraFront: { type: String, default: '' },
    cpu: { type: String, default: '' },
    ram: { type: String, default: '' },
    rom: { type: String, default: '' },
    microUSB: { type: String, default: '' },
    battery: { type: String, default: '' }
}, { _id: false });

// Định nghĩa Schema chính cho sản phẩm (Product)
const productSchema = new mongoose.Schema({
    masp: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    company: { type: String, required: true },
    img: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, min: 0, default: 100 },
    star: { type: Number, default: 0 },
    rateCount: { type: Number, default: 0 },
    promo: { type: promoSchema, required: true },
    detail: { type: detailSchema, required: true }
}, {
    timestamps: true,
    collection: 'products'
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
