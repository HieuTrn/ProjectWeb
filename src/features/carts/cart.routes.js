const { layGioHang, themVaoGioHang, capNhatSoLuong, xoaKhoiGioHang, lamSachGioHang } = require('./cart.service');
const userService = require('../users/user.service');
const { guiThanhCong, guiLoi } = require('../../http/response');

function laySessionIdTuCookie(req) {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(';').reduce((acc, c) => {
        const parts = c.split('=');
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim();
        if (key) acc[key] = val;
        return acc;
    }, {});
    return cookies['session_id'] || null;
}

async function layUserHienTai(req) {
    const sessionId = laySessionIdTuCookie(req);
    return await userService.layUserTuSession(sessionId);
}

function dangKyRoutes(router) {
    router.get('/api/cart', async (req, res) => {
        try {
            const user = await layUserHienTai(req);
            if (!user) {
                return guiLoi(res, 'UNAUTHORIZED', 'Chưa đăng nhập', 401);
            }
            const gioHang = await layGioHang(user._id);
            guiThanhCong(res, gioHang);
        } catch (loi) {
            console.error('Lỗi khi lấy giỏ hàng:', loi);
            guiLoi(res, 'INTERNAL_SERVER_ERROR', 'Lỗi khi lấy giỏ hàng', 500);
        }
    });

    router.post('/api/cart/add', async (req, res) => {
        try {
            const user = await layUserHienTai(req);
            if (!user) {
                return guiLoi(res, 'UNAUTHORIZED', 'Chưa đăng nhập', 401);
            }
            const { masp, soluong } = req.body;
            if (!masp) {
                return guiLoi(res, 'BAD_REQUEST', 'Thiếu mã sản phẩm (masp)', 400);
            }
            const soLuongInt = parseInt(soluong, 10) || 1;
            const gioHang = await themVaoGioHang(user._id, masp, soLuongInt);
            guiThanhCong(res, gioHang);
        } catch (loi) {
            console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', loi);
            guiLoi(res, 'BAD_REQUEST', loi.message || 'Lỗi khi thêm vào giỏ hàng', 400);
        }
    });

    router.put('/api/cart/update', async (req, res) => {
        try {
            const user = await layUserHienTai(req);
            if (!user) {
                return guiLoi(res, 'UNAUTHORIZED', 'Chưa đăng nhập', 401);
            }
            const { masp, soluong } = req.body;
            if (!masp || soluong === undefined) {
                return guiLoi(res, 'BAD_REQUEST', 'Thiếu mã sản phẩm hoặc số lượng', 400);
            }
            const soLuongInt = parseInt(soluong, 10);
            const gioHang = await capNhatSoLuong(user._id, masp, soLuongInt);
            guiThanhCong(res, gioHang);
        } catch (loi) {
            console.error('Lỗi khi cập nhật số lượng sản phẩm:', loi);
            guiLoi(res, 'BAD_REQUEST', loi.message || 'Lỗi khi cập nhật số lượng', 400);
        }
    });

    router.delete('/api/cart/remove', async (req, res) => {
        try {
            const user = await layUserHienTai(req);
            if (!user) {
                return guiLoi(res, 'UNAUTHORIZED', 'Chưa đăng nhập', 401);
            }
            const { masp } = req.query;
            if (!masp) {
                return guiLoi(res, 'BAD_REQUEST', 'Thiếu mã sản phẩm cần xóa', 400);
            }
            const gioHang = await xoaKhoiGioHang(user._id, masp);
            guiThanhCong(res, gioHang);
        } catch (loi) {
            console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', loi);
            guiLoi(res, 'BAD_REQUEST', loi.message || 'Lỗi khi xóa sản phẩm', 400);
        }
    });

    router.delete('/api/cart/clear', async (req, res) => {
        try {
            const user = await layUserHienTai(req);
            if (!user) {
                return guiLoi(res, 'UNAUTHORIZED', 'Chưa đăng nhập', 401);
            }
            const gioHang = await lamSachGioHang(user._id);
            guiThanhCong(res, gioHang);
        } catch (loi) {
            console.error('Lỗi khi làm sạch giỏ hàng:', loi);
            guiLoi(res, 'INTERNAL_SERVER_ERROR', 'Lỗi khi làm sạch giỏ hàng', 500);
        }
    });
}

module.exports = {
    dangKyRoutes
};
