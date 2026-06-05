const test = require('node:test');
const assert = require('node:assert');
const { xuLyYeuCau } = require('../src/app');
const User = require('../src/features/users/user.model');
const Session = require('../src/features/users/session.model');
const Order = require('../src/features/orders/order.model');
const Product = require('../src/features/products/product.model');
const Cart = require('../src/features/carts/cart.model');

test.describe('Kiểm thử API Admin mới (Khách hàng, Đơn hàng, Thống kê)', () => {
    let mockUsers = [];
    let mockOrders = [];
    let mockSessions = [];
    let mockCarts = [];
    let mockProducts = [];

    test.before(() => {
        Session.findOne = async (query) => {
            if (query.sessionId === 'admin_session') {
                return { sessionId: 'admin_session', userId: 'admin_id_999', expiresAt: new Date(Date.now() + 10000) };
            }
            if (query.sessionId === 'user_session') {
                return { sessionId: 'user_session', userId: 'user_id_111', expiresAt: new Date(Date.now() + 10000) };
            }
            return null;
        };

        User.findById = (id) => {
            let found;
            if (id === 'admin_id_999') {
                found = { _id: 'admin_id_999', username: 'admin', role: 'admin', off: false };
            } else if (id === 'user_id_111') {
                found = { _id: 'user_id_111', username: 'testuser', role: 'user', off: false };
            }
            return {
                lean: async () => found || null
            };
        };

        User.find = (query) => {
            const ketQua = mockUsers.filter(u => !query.role || u.role === query.role);
            return {
                select: () => ({
                    lean: async () => ketQua
                })
            };
        };

        User.findOneAndUpdate = async (filter, update) => {
            const index = mockUsers.findIndex(u => u.username === filter.username);
            if (index !== -1) {
                mockUsers[index] = { ...mockUsers[index], ...update };
                return {
                    toObject: () => mockUsers[index]
                };
            }
            return null;
        };

        User.findOne = async (query) => {
            return mockUsers.find(u => u.username === query.username) || null;
        };

        User.deleteOne = async (query) => {
            mockUsers = mockUsers.filter(u => u._id !== query._id);
            return { deletedCount: 1 };
        };

        Order.find = (query) => {
            let ketQua = mockOrders;
            if (query.tinhTrang && query.tinhTrang.$ne) {
                ketQua = mockOrders.filter(o => o.tinhTrang !== query.tinhTrang.$ne);
            }
            return {
                sort: () => ({
                    lean: async () => ketQua
                }),
                lean: async () => ketQua
            };
        };

        Order.findById = async (id) => {
            const found = mockOrders.find(o => o._id === id);
            if (!found) return null;
            return {
                ...found,
                save: async function() {
                    const idx = mockOrders.findIndex(o => o._id === id);
                    if (idx !== -1) mockOrders[idx] = this;
                    return this;
                },
                toObject: function() {
                    return this;
                }
            };
        };

        Order.deleteMany = async (query) => {
            mockOrders = mockOrders.filter(o => o.userId !== query.userId);
            return { deletedCount: 1 };
        };

        Cart.deleteOne = async (query) => {
            mockCarts = mockCarts.filter(c => c.userId !== query.userId);
            return { deletedCount: 1 };
        };

        Session.deleteMany = async (query) => {
            mockSessions = mockSessions.filter(s => s.userId !== query.userId);
            return { deletedCount: 1 };
        };

        Product.find = (query) => {
            let ketQua = mockProducts;
            if (query.masp && query.masp.$in) {
                ketQua = mockProducts.filter(p => query.masp.$in.includes(p.masp));
            }
            return {
                select: () => ({
                    lean: async () => ketQua
                })
            };
        };

        Product.updateOne = async (filter, update) => {
            const index = mockProducts.findIndex(p => p.masp === filter.masp);
            if (index !== -1) {
                if (update.$inc && update.$inc.stock) {
                    mockProducts[index].stock += update.$inc.stock;
                }
            }
            return { modifiedCount: 1 };
        };
    });

    test.beforeEach(() => {
        mockUsers = [
            { _id: 'user_id_111', username: 'testuser', ho: 'Nguyen', ten: 'An', email: 'an@gmail.com', role: 'user', off: false },
            { _id: 'admin_id_999', username: 'admin', ho: 'Admin', ten: 'Web', email: 'admin@gmail.com', role: 'admin', off: false }
        ];
        mockOrders = [
            { _id: 'order_1', userId: 'user_id_111', items: [{ masp: 'iPhone15', name: 'iPhone 15', gia: 21000000, soluong: 1, thanhTien: 21000000 }], tongTien: 21000000, tinhTrang: 'Đang chờ xử lý', ngayMua: new Date() }
        ];
        mockCarts = [];
        mockSessions = [];
        mockProducts = [
            { masp: 'iPhone15', name: 'iPhone 15', company: 'iPhone', price: 22000000, stock: 10 }
        ];
    });

    test.it('Nên từ chối lấy danh sách khách hàng nếu không phải admin', async () => {
        const mockReq = {
            url: '/api/admin/users',
            method: 'GET',
            headers: { host: 'localhost', cookie: 'session_id=user_session' }
        };
        let statusCode = 0;
        let responseBody = '';
        const mockRes = {
            writeHead: (status) => { statusCode = status; },
            end: (data) => { responseBody = data; }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 403);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, false);
    });

    test.it('Nên lấy danh sách khách hàng thành công nếu là admin', async () => {
        const mockReq = {
            url: '/api/admin/users',
            method: 'GET',
            headers: { host: 'localhost', cookie: 'session_id=admin_session' }
        };
        let statusCode = 0;
        let responseBody = '';
        const mockRes = {
            writeHead: (status) => { statusCode = status; },
            end: (data) => { responseBody = data; }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 200);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, true);
        assert.strictEqual(resJson.data.length, 1);
        assert.strictEqual(resJson.data[0].username, 'testuser');
    });

    test.it('Nên khóa hoặc mở khóa tài khoản người dùng thành công', async () => {
        const mockReq = {
            url: '/api/admin/users/status',
            method: 'PUT',
            headers: { host: 'localhost', cookie: 'session_id=admin_session' },
            on: (event, handler) => {
                if (event === 'data') handler(Buffer.from(JSON.stringify({ username: 'testuser', off: true })));
                if (event === 'end') handler();
            }
        };
        let statusCode = 0;
        let responseBody = '';
        const mockRes = {
            writeHead: (status) => { statusCode = status; },
            end: (data) => { responseBody = data; }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 200);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, true);
        assert.strictEqual(resJson.data.off, true);
    });

    test.it('Nên xóa tài khoản người dùng và dữ liệu liên quan thành công', async () => {
        const mockReq = {
            url: '/api/admin/users?username=testuser',
            method: 'DELETE',
            headers: { host: 'localhost', cookie: 'session_id=admin_session' }
        };
        let statusCode = 0;
        let responseBody = '';
        const mockRes = {
            writeHead: (status) => { statusCode = status; },
            end: (data) => { responseBody = data; }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 200);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, true);
        assert.strictEqual(mockUsers.length, 1);
        assert.strictEqual(mockOrders.length, 0);
    });

    test.it('Nên lấy danh sách toàn bộ đơn hàng admin thành công kèm tên khách', async () => {
        const mockReq = {
            url: '/api/admin/orders',
            method: 'GET',
            headers: { host: 'localhost', cookie: 'session_id=admin_session' }
        };
        let statusCode = 0;
        let responseBody = '';
        const mockRes = {
            writeHead: (status) => { statusCode = status; },
            end: (data) => { responseBody = data; }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 200);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, true);
        assert.strictEqual(resJson.data.length, 1);
        assert.strictEqual(resJson.data[0].khachhang, 'testuser');
    });

    test.it('Nên duyệt đơn hàng thành công', async () => {
        const mockReq = {
            url: '/api/admin/orders/status',
            method: 'PUT',
            headers: { host: 'localhost', cookie: 'session_id=admin_session' },
            on: (event, handler) => {
                if (event === 'data') handler(Buffer.from(JSON.stringify({ orderId: 'order_1', duyetDon: true })));
                if (event === 'end') handler();
            }
        };
        let statusCode = 0;
        let responseBody = '';
        const mockRes = {
            writeHead: (status) => { statusCode = status; },
            end: (data) => { responseBody = data; }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 200);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, true);
        assert.strictEqual(resJson.data.tinhTrang, 'Đã giao hàng');
    });

    test.it('Nên hủy đơn hàng và hoàn trả tồn kho thành công', async () => {
        const mockReq = {
            url: '/api/admin/orders/status',
            method: 'PUT',
            headers: { host: 'localhost', cookie: 'session_id=admin_session' },
            on: (event, handler) => {
                if (event === 'data') handler(Buffer.from(JSON.stringify({ orderId: 'order_1', duyetDon: false })));
                if (event === 'end') handler();
            }
        };
        let statusCode = 0;
        let responseBody = '';
        const mockRes = {
            writeHead: (status) => { statusCode = status; },
            end: (data) => { responseBody = data; }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 200);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, true);
        assert.strictEqual(resJson.data.tinhTrang, 'Đã hủy');
        assert.strictEqual(mockProducts[0].stock, 11);
    });

    test.it('Nên lấy dữ liệu thống kê hãng thành công', async () => {
        const mockReq = {
            url: '/api/admin/stats',
            method: 'GET',
            headers: { host: 'localhost', cookie: 'session_id=admin_session' }
        };
        let statusCode = 0;
        let responseBody = '';
        const mockRes = {
            writeHead: (status) => { statusCode = status; },
            end: (data) => { responseBody = data; }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 200);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, true);
        assert.ok(resJson.data.iPhone);
        assert.strictEqual(resJson.data.iPhone.soLuongBanRa, 1);
        assert.strictEqual(resJson.data.iPhone.doanhThu, 21000000);
    });
});
