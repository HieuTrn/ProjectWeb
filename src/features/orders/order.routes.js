const {
    taoDonHang,
    layDanhSachDonHang,
    layChiTietDonHang,
    layDanhSachDonHangAdmin,
    duyetDonHangAdmin,
    layThongKeAdmin
} = require('./order.service');
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

async function kiemTraQuyenAdmin(req) {
    const sessionId = laySessionIdTuCookie(req);
    const user = await userService.layUserTuSession(sessionId);
    return user && user.role === 'admin';
}

function dangKyRoutes(router) {
    router.post('/api/orders/checkout', async (req, res) => {
        try {
            const user = await layUserHienTai(req);
            if (!user) {
                return guiLoi(res, 'UNAUTHORIZED', 'Chưa đăng nhập', 401);
            }
            const { idempotencyKey } = req.body;
            const donHang = await taoDonHang(user._id, idempotencyKey);
            guiThanhCong(res, donHang);
        } catch (loi) {
            guiLoi(res, 'BAD_REQUEST', loi.message || 'Lỗi khi tạo đơn hàng', 400);
        }
    });

    router.get('/api/orders', async (req, res) => {
        try {
            const user = await layUserHienTai(req);
            if (!user) {
                return guiLoi(res, 'UNAUTHORIZED', 'Chưa đăng nhập', 401);
            }
            const dsDonHang = await layDanhSachDonHang(user._id);
            guiThanhCong(res, dsDonHang);
        } catch (loi) {
            console.error('Get orders error:', loi);
            guiLoi(res, 'INTERNAL_SERVER_ERROR', 'Lỗi khi lấy danh sách đơn hàng', 500);
        }
    });

    router.get('/api/orders/detail', async (req, res) => {
        try {
            const user = await layUserHienTai(req);
            if (!user) {
                return guiLoi(res, 'UNAUTHORIZED', 'Chưa đăng nhập', 401);
            }
            const { id } = req.query;
            if (!id) {
                return guiLoi(res, 'BAD_REQUEST', 'Thiếu mã đơn hàng (id)', 400);
            }
            const donHang = await layChiTietDonHang(id, user._id);
            if (!donHang) {
                return guiLoi(res, 'NOT_FOUND', 'Không tìm thấy đơn hàng', 404);
            }
            guiThanhCong(res, donHang);
        } catch (loi) {
            console.error('Get order detail error:', loi);
            guiLoi(res, 'INTERNAL_SERVER_ERROR', 'Lỗi khi lấy chi tiết đơn hàng', 500);
        }
    });

    router.get('/api/admin/orders', async (req, res) => {
        try {
            const isAdmin = await kiemTraQuyenAdmin(req);
            if (!isAdmin) {
                return guiLoi(res, 'FORBIDDEN', 'Yêu cầu quyền admin', 403);
            }
            const dsDonHang = await layDanhSachDonHangAdmin();
            guiThanhCong(res, dsDonHang);
        } catch (loi) {
            console.error('Get admin orders error:', loi);
            guiLoi(res, 'INTERNAL_SERVER_ERROR', 'Lỗi hệ thống', 500);
        }
    });

    router.put('/api/admin/orders/status', async (req, res) => {
        try {
            const isAdmin = await kiemTraQuyenAdmin(req);
            if (!isAdmin) {
                return guiLoi(res, 'FORBIDDEN', 'Yêu cầu quyền admin', 403);
            }
            const { orderId, duyetDon } = req.body;
            if (!orderId || typeof duyetDon !== 'boolean') {
                return guiLoi(res, 'BAD_REQUEST', 'Thiếu thông tin bắt buộc', 400);
            }
            const donHang = await duyetDonHangAdmin(orderId, duyetDon);
            guiThanhCong(res, donHang);
        } catch (loi) {
            guiLoi(res, 'BAD_REQUEST', loi.message || 'Lỗi khi cập nhật trạng thái đơn hàng', 400);
        }
    });

    router.get('/api/admin/stats', async (req, res) => {
        try {
            const isAdmin = await kiemTraQuyenAdmin(req);
            if (!isAdmin) {
                return guiLoi(res, 'FORBIDDEN', 'Yêu cầu quyền admin', 403);
            }
            const dataStats = await layThongKeAdmin();
            guiThanhCong(res, dataStats);
        } catch (loi) {
            console.error('Get stats error:', loi);
            guiLoi(res, 'INTERNAL_SERVER_ERROR', 'Lỗi hệ thống', 500);
        }
    });
}

module.exports = {
    dangKyRoutes
};
