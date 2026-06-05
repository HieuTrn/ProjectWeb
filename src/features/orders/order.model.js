const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    masp: { type: String, required: true },
    name: { type: String, required: true },
    img: { type: String, default: '' },
    gia: { type: Number, required: true },
    soluong: { type: Number, required: true, min: 1 },
    thanhTien: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    idempotencyKey: {
        type: String
    },
    items: {
        type: [orderItemSchema],
        required: true,
        validate: {
            validator: function(v) { return v.length > 0; },
            message: 'Đơn hàng phải có ít nhất 1 sản phẩm'
        }
    },
    tongTien: { type: Number, required: true },
    tinhTrang: {
        type: String,
        enum: ['Đang chờ xử lý', 'Đã giao hàng', 'Đã hủy'],
        default: 'Đang chờ xử lý'
    },
    ngayMua: { type: Date, default: Date.now }
}, {
    timestamps: true
});

orderSchema.index(
    { userId: 1, idempotencyKey: 1 },
    {
        unique: true,
        partialFilterExpression: {
            idempotencyKey: { $exists: true }
        }
    }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
