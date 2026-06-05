const {
    dangKy,
    dangNhap,
    dangXuat,
    layUserTuSession,
    layDanhSachKhachHangAdmin,
    capNhatTrangThaiKhoaAdmin,
    xoaKhachHangAdmin,
    capNhatThongTinCaNhan,
    doiMatKhau
} = require('./user.service');
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

async function kiemTraQuyenAdmin(req) {
    const sessionId = laySessionIdTuCookie(req);
    const user = await layUserTuSession(sessionId);
    return user && user.role === 'admin';
}

function dangKyRoutes(router) {
    router.post('/api/auth/register', async (req, res) => {
        try {
            const { username, pass, ho, ten, email } = req.body;
            if (!username || !pass) {
                return guiLoi(res, 'BAD_REQUEST', 'Thiếu tên đăng nhập hoặc mật khẩu', 400);
            }
            const user = await dangKy({ username, pass, ho, ten, email });
            guiThanhCong(res, user);
        } catch (loi) {
            guiLoi(res, 'BAD_REQUEST', loi.message || 'Lỗi khi đăng ký', 400);
        }
    });

    router.post('/api/auth/login', async (req, res) => {
        try {
            const { username, pass } = req.body;
            if (!username || !pass) {
                return guiLoi(res, 'BAD_REQUEST', 'Thiếu tên đăng nhập hoặc mật khẩu', 400);
            }
            const { sessionId, user } = await dangNhap(username, pass);
            const cookieString = `session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
            guiThanhCong(res, user, 200, { 'Set-Cookie': cookieString });
        } catch (loi) {
            guiLoi(res, 'UNAUTHORIZED', loi.message || 'Lỗi đăng nhập', 401);
        }
    });

    router.post('/api/auth/logout', async (req, res) => {
        try {
            const sessionId = laySessionIdTuCookie(req);
            await dangXuat(sessionId);
            const cookieString = `session_id=; Path=/; HttpOnly; Max-Age=0`;
            guiThanhCong(res, null, 200, { 'Set-Cookie': cookieString });
        } catch (loi) {
            console.error('Logout error:', loi);
            guiLoi(res, 'INTERNAL_SERVER_ERROR', 'Lỗi khi đăng xuất', 500);
        }
    });

    router.get('/api/auth/me', async (req, res) => {
        try {
            const sessionId = laySessionIdTuCookie(req);
            const user = await layUserTuSession(sessionId);
            if (!user) {
                return guiLoi(res, 'UNAUTHORIZED', 'Chưa đăng nhập', 401);
            }
            guiThanhCong(res, user);
        } catch (loi) {
            console.error('Auth me error:', loi);
            guiLoi(res, 'INTERNAL_SERVER_ERROR', 'Lỗi hệ thống', 500);
        }
    });

    router.get('/api/admin/users', async (req, res) => {
        try {
            const isAdmin = await kiemTraQuyenAdmin(req);
            if (!isAdmin) {
                return guiLoi(res, 'FORBIDDEN', 'Yêu cầu quyền admin', 403);
            }
            const dsKhachHang = await layDanhSachKhachHangAdmin();
            guiThanhCong(res, dsKhachHang);
        } catch (loi) {
            console.error('Get admin users error:', loi);
            guiLoi(res, 'INTERNAL_SERVER_ERROR', 'Lỗi hệ thống', 500);
        }
    });

    router.put('/api/admin/users/status', async (req, res) => {
        try {
            const isAdmin = await kiemTraQuyenAdmin(req);
            if (!isAdmin) {
                return guiLoi(res, 'FORBIDDEN', 'Yêu cầu quyền admin', 403);
            }
            const { username, off } = req.body;
            if (!username || typeof off !== 'boolean') {
                return guiLoi(res, 'BAD_REQUEST', 'Thiếu dữ liệu bắt buộc', 400);
            }
            const user = await capNhatTrangThaiKhoaAdmin(username, off);
            guiThanhCong(res, user);
        } catch (loi) {
            guiLoi(res, 'BAD_REQUEST', loi.message || 'Lỗi khi cập nhật trạng thái', 400);
        }
    });

    router.delete('/api/admin/users', async (req, res) => {
        try {
            const isAdmin = await kiemTraQuyenAdmin(req);
            if (!isAdmin) {
                return guiLoi(res, 'FORBIDDEN', 'Yêu cầu quyền admin', 403);
            }
            const { username } = req.query;
            if (!username) {
                return guiLoi(res, 'BAD_REQUEST', 'Thiếu username', 400);
            }
            await xoaKhachHangAdmin(username);
            guiThanhCong(res, { success: true });
        } catch (loi) {
            guiLoi(res, 'BAD_REQUEST', loi.message || 'Lỗi khi xóa người dùng', 400);
        }
    });

    router.put('/api/users/profile', async (req, res) => {
        try {
            const sessionId = laySessionIdTuCookie(req);
            const user = await layUserTuSession(sessionId);
            if (!user) {
                return guiLoi(res, 'UNAUTHORIZED', 'Chưa đăng nhập', 401);
            }
            const { ho, ten, email } = req.body;
            const updatedUser = await capNhatThongTinCaNhan(user._id, { ho, ten, email });
            guiThanhCong(res, updatedUser);
        } catch (loi) {
            guiLoi(res, 'BAD_REQUEST', loi.message || 'Lỗi khi cập nhật thông tin', 400);
        }
    });

    router.put('/api/users/password', async (req, res) => {
        try {
            const sessionId = laySessionIdTuCookie(req);
            const user = await layUserTuSession(sessionId);
            if (!user) {
                return guiLoi(res, 'UNAUTHORIZED', 'Chưa đăng nhập', 401);
            }
            const { passCu, passMoi } = req.body;
            if (!passCu || !passMoi) {
                return guiLoi(res, 'BAD_REQUEST', 'Thiếu mật khẩu cũ hoặc mới', 400);
            }
            await doiMatKhau(user._id, passCu, passMoi);
            guiThanhCong(res, null);
        } catch (loi) {
            guiLoi(res, 'BAD_REQUEST', loi.message || 'Lỗi khi đổi mật khẩu', 400);
        }
    });
}

module.exports = {
    dangKyRoutes
};
