const test = require('node:test');
const assert = require('node:assert');
const { xuLyYeuCau } = require('../src/app');
const User = require('../src/features/users/user.model');
const Session = require('../src/features/users/session.model');
const Cart = require('../src/features/carts/cart.model');
const Product = require('../src/features/products/product.model');

test.describe('Kiểm thử API Giỏ hàng (Cart)', () => {
    let mockCartDb = {
        userId: 'user_id_123',
        items: []
    };

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
                lean: async () => userObj,
                toObject: function() { return userObj; }
            };
        };

        Product.findOne = async (query) => {
            if (query.masp === 'iPhone12') {
                return {
                    masp: 'iPhone12',
                    name: 'iPhone 12',
                    img: 'img/iphone12.jpg',
                    price: 18000000,
                    promo: { name: 'giareonline', value: '17000000' }
                };
            }
            return null;
        };

        Product.find = (query) => {
            const dsSanPham = [
                {
                    masp: 'iPhone12',
                    name: 'iPhone 12',
                    img: 'img/iphone12.jpg',
                    price: 18000000,
                    promo: { name: 'giareonline', value: '17000000' }
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

        Cart.findOne = async (query) => {
            if (query.userId === 'user_id_123') {
                return {
                    userId: mockCartDb.userId,
                    items: mockCartDb.items,
                    save: async function() {
                        mockCartDb.items = this.items;
                        return this;
                    }
                };
            }
            return null;
        };

        Cart.prototype.save = async function() {
            mockCartDb.items = this.items;
            return this;
        };
    });

    test.beforeEach(() => {
        mockCartDb.items = [];
    });

    test.it('Nên từ chối truy cập giỏ hàng nếu chưa đăng nhập', async () => {
        const mockReq = {
            url: '/api/cart',
            method: 'GET',
            headers: { host: 'localhost' }
        };

        let responseBody = '';
        let statusCode = 0;

        const mockRes = {
            writeHead: (status) => { statusCode = status; },
            end: (data) => { responseBody = data; }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 401);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, false);
        assert.strictEqual(resJson.error.code, 'UNAUTHORIZED');
    });

    test.it('Nên lấy giỏ hàng trống thành công cho user mới đăng nhập', async () => {
        const mockReq = {
            url: '/api/cart',
            method: 'GET',
            headers: {
                host: 'localhost',
                cookie: 'session_id=valid_session_id'
            }
        };

        let responseBody = '';
        let statusCode = 0;

        const mockRes = {
            writeHead: (status) => { statusCode = status; },
            end: (data) => { responseBody = data; }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 200);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, true);
        assert.deepStrictEqual(resJson.data, []);
    });

    test.it('Nên thêm sản phẩm vào giỏ hàng thành công', async () => {
        const mockReq = {
            url: '/api/cart/add',
            method: 'POST',
            headers: {
                host: 'localhost',
                cookie: 'session_id=valid_session_id'
            },
            on: (event, handler) => {
                if (event === 'data') {
                    handler(Buffer.from(JSON.stringify({
                        masp: 'iPhone12',
                        soluong: 2
                    })));
                }
                if (event === 'end') {
                    handler();
                }
            }
        };

        let responseBody = '';
        let statusCode = 0;

        const mockRes = {
            writeHead: (status) => { statusCode = status; },
            end: (data) => { responseBody = data; }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 200);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, true);
        assert.strictEqual(resJson.data.length, 1);
        assert.strictEqual(resJson.data[0].masp, 'iPhone12');
        assert.strictEqual(resJson.data[0].soluong, 2);
        assert.strictEqual(resJson.data[0].sanPham.name, 'iPhone 12');
    });

    test.it('Nên cập nhật số lượng sản phẩm thành công', async () => {
        mockCartDb.items = [{ masp: 'iPhone12', soluong: 2, date: new Date() }];

        const mockReq = {
            url: '/api/cart/update',
            method: 'PUT',
            headers: {
                host: 'localhost',
                cookie: 'session_id=valid_session_id'
            },
            on: (event, handler) => {
                if (event === 'data') {
                    handler(Buffer.from(JSON.stringify({
                        masp: 'iPhone12',
                        soluong: 5
                    })));
                }
                if (event === 'end') {
                    handler();
                }
            }
        };

        let responseBody = '';
        let statusCode = 0;

        const mockRes = {
            writeHead: (status) => { statusCode = status; },
            end: (data) => { responseBody = data; }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 200);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, true);
        assert.strictEqual(resJson.data[0].soluong, 5);
    });

    test.it('Nên xóa sản phẩm khỏi giỏ hàng thành công', async () => {
        mockCartDb.items = [{ masp: 'iPhone12', soluong: 2, date: new Date() }];

        const mockReq = {
            url: '/api/cart/remove?masp=iPhone12',
            method: 'DELETE',
            headers: {
                host: 'localhost',
                cookie: 'session_id=valid_session_id'
            }
        };

        let responseBody = '';
        let statusCode = 0;

        const mockRes = {
            writeHead: (status) => { statusCode = status; },
            end: (data) => { responseBody = data; }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 200);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, true);
        assert.deepStrictEqual(resJson.data, []);
    });

    test.it('Nên làm sạch giỏ hàng thành công', async () => {
        mockCartDb.items = [{ masp: 'iPhone12', soluong: 2, date: new Date() }];

        const mockReq = {
            url: '/api/cart/clear',
            method: 'DELETE',
            headers: {
                host: 'localhost',
                cookie: 'session_id=valid_session_id'
            }
        };

        let responseBody = '';
        let statusCode = 0;

        const mockRes = {
            writeHead: (status) => { statusCode = status; },
            end: (data) => { responseBody = data; }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 200);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, true);
        assert.deepStrictEqual(resJson.data, []);
    });
});
