const test = require('node:test');
const assert = require('node:assert');
const { xuLyYeuCau } = require('../src/app');
const User = require('../src/features/users/user.model');
const Session = require('../src/features/users/session.model');
const Cart = require('../src/features/carts/cart.model');
const Product = require('../src/features/products/product.model');
const Order = require('../src/features/orders/order.model');

test.describe('Kiểm thử API Đơn hàng (Orders)', () => {
    let mockCartItems = [];
    let mockOrders = [];
    let mockProductStock = 100;

    test.before(() => {
        Session.findOne = async (query) => {
            if (query.sessionId === 'valid_session_id') {
                return {
                    sessionId: 'valid_session_id',
                    userId: 'user_id_123',
                    expiresAt: new Date(Date.now() + 10000)
                };
            }
            return null;
        };

        User.findById = (id) => {
            const userObj = {
                _id: id,
                username: 'testuser',
                role: 'user'
            };
            return {
                lean: async () => userObj
            };
        };

        Cart.findOne = async (query) => {
            if (query.userId === 'user_id_123') {
                return {
                    userId: 'user_id_123',
                    items: mockCartItems,
                    save: async function() {
                        mockCartItems = this.items;
                        return this;
                    }
                };
            }
            return null;
        };

        Product.find = (query) => {
            const dsSanPham = [
                {
                    masp: 'iPhone15',
                    name: 'iPhone 15',
                    img: 'img/iphone15.jpg',
                    price: 22000000,
                    stock: mockProductStock,
                    promo: { name: 'giareonline', value: '21000000' }
                }
            ];
            return {
                lean: async () => {
                    if (query.masp && query.masp.$in) {
                        return dsSanPham.filter(sp => query.masp.$in.includes(sp.masp));
                    }
                    return dsSanPham;
                }
            };
        };

        Product.updateOne = async (filter, update) => {
            if (filter.stock && filter.stock.$gte) {
                if (mockProductStock < filter.stock.$gte) {
                    return { modifiedCount: 0 };
                }
            }
            if (update.$inc && update.$inc.stock) {
                mockProductStock += update.$inc.stock;
            }
            return { modifiedCount: 1 };
        };

        Order.findOne = (query) => {
            return {
                lean: async () => {
                    if (query.idempotencyKey) {
                        return mockOrders.find(o => o.idempotencyKey === query.idempotencyKey) || null;
                    }
                    if (query._id && query.userId) {
                        return mockOrders.find(o => o._id === query._id && o.userId === query.userId) || null;
                    }
                    return null;
                }
            };
        };

        Order.find = (query) => {
            const ketQua = mockOrders.filter(o => o.userId === query.userId);
            return {
                sort: () => ({
                    lean: async () => ketQua
                })
            };
        };

        Order.prototype.save = async function() {
            const obj = this.toObject();
            obj._id = 'order_' + Date.now();
            mockOrders.push(obj);
            return this;
        };
    });

    test.beforeEach(() => {
        mockCartItems = [];
        mockOrders = [];
        mockProductStock = 100;
    });

    test.it('Nên từ chối checkout nếu chưa đăng nhập', async () => {
        const mockReq = {
            url: '/api/orders/checkout',
            method: 'POST',
            headers: { host: 'localhost' },
            on: (event, handler) => {
                if (event === 'data') handler(Buffer.from(JSON.stringify({})));
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

        assert.strictEqual(statusCode, 401);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, false);
    });

    test.it('Nên từ chối checkout nếu giỏ hàng trống', async () => {
        mockCartItems = [];

        const mockReq = {
            url: '/api/orders/checkout',
            method: 'POST',
            headers: {
                host: 'localhost',
                cookie: 'session_id=valid_session_id'
            },
            on: (event, handler) => {
                if (event === 'data') handler(Buffer.from(JSON.stringify({ idempotencyKey: 'key1' })));
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

        assert.strictEqual(statusCode, 400);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, false);
    });

    test.it('Nên checkout thành công và tạo đơn hàng với snapshot đúng', async () => {
        mockCartItems = [{ masp: 'iPhone15', soluong: 2, date: new Date() }];

        const mockReq = {
            url: '/api/orders/checkout',
            method: 'POST',
            headers: {
                host: 'localhost',
                cookie: 'session_id=valid_session_id'
            },
            on: (event, handler) => {
                if (event === 'data') handler(Buffer.from(JSON.stringify({ idempotencyKey: 'checkout_key_1' })));
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
        assert.strictEqual(resJson.data.items.length, 1);
        assert.strictEqual(resJson.data.items[0].masp, 'iPhone15');
        assert.strictEqual(resJson.data.items[0].name, 'iPhone 15');
        assert.strictEqual(resJson.data.items[0].gia, 21000000);
        assert.strictEqual(resJson.data.items[0].soluong, 2);
        assert.strictEqual(resJson.data.items[0].thanhTien, 42000000);
        assert.strictEqual(resJson.data.tongTien, 42000000);
        assert.strictEqual(resJson.data.tinhTrang, 'Đang chờ xử lý');
        assert.strictEqual(mockProductStock, 98);
        assert.strictEqual(mockCartItems.length, 0);
    });

    test.it('Nên chống tạo đơn trùng bằng idempotencyKey', async () => {
        mockOrders = [{
            _id: 'existing_order',
            userId: 'user_id_123',
            idempotencyKey: 'duplicate_key',
            items: [{ masp: 'iPhone15', name: 'iPhone 15', gia: 21000000, soluong: 1, thanhTien: 21000000 }],
            tongTien: 21000000,
            tinhTrang: 'Đang chờ xử lý'
        }];
        mockCartItems = [{ masp: 'iPhone15', soluong: 1, date: new Date() }];
        const stockTruoc = mockProductStock;

        const mockReq = {
            url: '/api/orders/checkout',
            method: 'POST',
            headers: {
                host: 'localhost',
                cookie: 'session_id=valid_session_id'
            },
            on: (event, handler) => {
                if (event === 'data') handler(Buffer.from(JSON.stringify({ idempotencyKey: 'duplicate_key' })));
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
        assert.strictEqual(mockProductStock, stockTruoc);
    });

    test.it('Nên từ chối checkout nếu tồn kho không đủ', async () => {
        mockCartItems = [{ masp: 'iPhone15', soluong: 200, date: new Date() }];
        mockProductStock = 5;

        const mockReq = {
            url: '/api/orders/checkout',
            method: 'POST',
            headers: {
                host: 'localhost',
                cookie: 'session_id=valid_session_id'
            },
            on: (event, handler) => {
                if (event === 'data') handler(Buffer.from(JSON.stringify({ idempotencyKey: 'key_stock_fail' })));
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

        assert.strictEqual(statusCode, 400);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, false);
    });

    test.it('Nên lấy danh sách đơn hàng thành công', async () => {
        mockOrders = [{
            _id: 'order_1',
            userId: 'user_id_123',
            items: [{ masp: 'iPhone15', name: 'iPhone 15', gia: 21000000, soluong: 1, thanhTien: 21000000 }],
            tongTien: 21000000,
            tinhTrang: 'Đang chờ xử lý',
            ngayMua: new Date()
        }];

        const mockReq = {
            url: '/api/orders',
            method: 'GET',
            headers: {
                host: 'localhost',
                cookie: 'session_id=valid_session_id'
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
        assert.strictEqual(resJson.data.length, 1);
        assert.strictEqual(resJson.data[0].tongTien, 21000000);
    });
});
