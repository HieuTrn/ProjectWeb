const Router = require('./http/router');
const { guiThanhCong, guiLoi } = require('./http/response');
const mongoose = require('mongoose');

const router = new Router();
const DS_TRANG_THAI_DATABASE = [
    'DISCONNECTED',
    'CONNECTED',
    'CONNECTING',
    'DISCONNECTING'
];

router.get('/api/health', async (req, res) => {
    const trangThaiDb = mongoose.connection.readyState;
    const tenTrangThaiDb = DS_TRANG_THAI_DATABASE[trangThaiDb] || 'UNKNOWN';

    if (trangThaiDb !== 1) {
        guiLoi(res, 'SERVICE_UNAVAILABLE', 'MongoDB chưa sẵn sàng', 503, {
            status: 'DOWN',
            database: tenTrangThaiDb
        });
        return;
    }

    const ketQua = {
        status: 'UP',
        database: tenTrangThaiDb
    };

    guiThanhCong(res, ketQua);
});

const productRoutes = require('./features/products/product.routes');
productRoutes.dangKyRoutes(router);

const userRoutes = require('./features/users/user.routes');
userRoutes.dangKyRoutes(router);

const cartRoutes = require('./features/carts/cart.routes');
cartRoutes.dangKyRoutes(router);

const orderRoutes = require('./features/orders/order.routes');
orderRoutes.dangKyRoutes(router);

async function xuLyYeuCau(req, res) {
    try {
        await router.giaiQuyet(req, res);
    } catch (loi) {
        console.error('Lỗi ngoài dự kiến khi xử lý request:', loi);
        guiLoi(res, 'INTERNAL_SERVER_ERROR', 'Lỗi hệ thống', 500);
    }
}

module.exports = {
    xuLyYeuCau
};
