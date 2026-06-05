const { layDanhSachSanPham, layChiTietSanPhamTheoMasp, layChiTietSanPhamTheoTen, themSanPham, suaSanPham, xoaSanPham } = require('./product.service');
const userService = require('../users/user.service');
const { guiThanhCong, guiLoi } = require('../../http/response');
const mongoose = require('mongoose');

function kiemTraMongoDbSanSang(res) {
    if (mongoose.connection.readyState === 1) {
        return true;
    }

    guiLoi(res, 'SERVICE_UNAVAILABLE', 'MongoDB chưa sẵn sàng', 503, {
        status: 'DOWN'
    });
    return false;
}

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

async function kiemTraQuyenAdmin(req, res) {
    const sessionId = laySessionIdTuCookie(req);
    const user = await userService.layUserTuSession(sessionId);
    if (!user || user.role !== 'admin') {
        guiLoi(res, 'FORBIDDEN', 'Bạn không có quyền thực hiện hành động này', 403);
        return null;
    }
    return user;
}

function dangKyRoutes(router) {
    router.get('/api/products', async (req, res) => {
        try {
            if (!kiemTraMongoDbSanSang(res)) return;

            const dsSanPham = await layDanhSachSanPham();
            guiThanhCong(res, dsSanPham);
        } catch (loi) {
            console.error('Lỗi khi lấy danh sách sản phẩm:', loi);
            guiLoi(res, 'INTERNAL_SERVER_ERROR', 'Không thể lấy danh sách sản phẩm', 500);
        }
    });

    router.get('/api/products/detail', async (req, res) => {
        try {
            if (!kiemTraMongoDbSanSang(res)) return;

            const { masp, name } = req.query;
            let sanPham = null;

            if (masp) {
                sanPham = await layChiTietSanPhamTheoMasp(masp);
            } else if (name) {
                sanPham = await layChiTietSanPhamTheoTen(name);
            } else {
                return guiLoi(res, 'BAD_REQUEST', 'Thiếu tham số mã sản phẩm (masp) hoặc tên sản phẩm (name)', 400);
            }

            if (!sanPham) {
                return guiLoi(res, 'NOT_FOUND', 'Không tìm thấy sản phẩm yêu cầu', 404);
            }

            guiThanhCong(res, sanPham);
        } catch (loi) {
            console.error('Lỗi khi lấy chi tiết sản phẩm:', loi);
            guiLoi(res, 'INTERNAL_SERVER_ERROR', 'Không thể lấy chi tiết sản phẩm', 500);
        }
    });

    router.post('/api/admin/products', async (req, res) => {
        try {
            if (!kiemTraMongoDbSanSang(res)) return;

            const adminUser = await kiemTraQuyenAdmin(req, res);
            if (!adminUser) return;

            const product = await themSanPham(req.body);
            guiThanhCong(res, product);
        } catch (loi) {
            console.error('Add product error:', loi);
            guiLoi(res, 'BAD_REQUEST', loi.message || 'Lỗi khi thêm sản phẩm', 400);
        }
    });

    router.put('/api/admin/products', async (req, res) => {
        try {
            if (!kiemTraMongoDbSanSang(res)) return;

            const adminUser = await kiemTraQuyenAdmin(req, res);
            if (!adminUser) return;

            const { masp } = req.query;
            if (!masp) {
                return guiLoi(res, 'BAD_REQUEST', 'Thiếu mã sản phẩm cần sửa', 400);
            }

            const product = await suaSanPham(masp, req.body);
            guiThanhCong(res, product);
        } catch (loi) {
            console.error('Update product error:', loi);
            guiLoi(res, 'BAD_REQUEST', loi.message || 'Lỗi khi sửa sản phẩm', 400);
        }
    });

    router.delete('/api/admin/products', async (req, res) => {
        try {
            if (!kiemTraMongoDbSanSang(res)) return;

            const adminUser = await kiemTraQuyenAdmin(req, res);
            if (!adminUser) return;

            const { masp } = req.query;
            if (!masp) {
                return guiLoi(res, 'BAD_REQUEST', 'Thiếu mã sản phẩm cần xóa', 400);
            }

            await xoaSanPham(masp);
            guiThanhCong(res, { message: 'Xóa sản phẩm thành công' });
        } catch (loi) {
            console.error('Delete product error:', loi);
            guiLoi(res, 'BAD_REQUEST', loi.message || 'Lỗi khi xóa sản phẩm', 400);
        }
    });
}

module.exports = {
    dangKyRoutes
};
