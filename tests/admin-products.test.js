const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const { xuLyYeuCau } = require('../src/app');
const Product = require('../src/features/products/product.model');

test.describe('Kiểm thử API CRUD sản phẩm của Admin', () => {
    const originalLayUserTuSession = require('../src/features/users/user.service').layUserTuSession;
    let originalFindOne;
    let originalFindOneAndUpdate;
    let originalDeleteOne;
    let originalReadyState;

    test.before(() => {
        originalReadyState = mongoose.connection.readyState;
        mongoose.connection.readyState = 1;

        require('../src/features/users/user.service').layUserTuSession = async (sessionId) => {
            if (sessionId === 'admin_session_id') {
                return { _id: 'admin_id_123', username: 'admin', role: 'admin' };
            }
            if (sessionId === 'user_session_id') {
                return { _id: 'user_id_123', username: 'user', role: 'user' };
            }
            return null;
        };

        originalFindOne = Product.findOne;
        originalFindOneAndUpdate = Product.findOneAndUpdate;
        originalDeleteOne = Product.deleteOne;

        Product.findOne = async (query) => {
            if (query.masp === 'App0' || query.masp === 'existed_masp') {
                return {
                    masp: query.masp,
                    name: 'iPhone X',
                    company: 'Apple',
                    price: 31990000,
                    toObject: function() { return this; }
                };
            }
            return null;
        };

        Product.prototype.save = async function() {
            return this;
        };

        Product.findOneAndUpdate = (query, update) => {
            const matched = {
                masp: query.masp,
                name: (update.$set && update.$set.name) || 'iPhone X Edited',
                price: (update.$set && update.$set.price) || 31000000
            };
            return {
                lean: async () => matched
            };
        };

        Product.deleteOne = async (query) => {
            if (query.masp === 'App0' || query.masp === 'existed_masp') {
                return { deletedCount: 1 };
            }
            return { deletedCount: 0 };
        };
    });

    test.after(() => {
        require('../src/features/users/user.service').layUserTuSession = originalLayUserTuSession;
        Product.findOne = originalFindOne;
        Product.findOneAndUpdate = originalFindOneAndUpdate;
        Product.deleteOne = originalDeleteOne;
        mongoose.connection.readyState = originalReadyState;
    });

    test.it('Nên từ chối thêm sản phẩm nếu không có session cookie', async () => {
        const mockReq = {
            url: '/api/admin/products',
            method: 'POST',
            headers: { host: 'localhost' },
            on: (event, handler) => {
                if (event === 'end') {
                    handler();
                }
            }
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
        assert.strictEqual(resJson.error.code, 'FORBIDDEN');
    });

    test.it('Nên từ chối thêm sản phẩm nếu không có quyền admin (user thường)', async () => {
        const mockReq = {
            url: '/api/admin/products',
            method: 'POST',
            headers: {
                host: 'localhost',
                cookie: 'session_id=user_session_id'
            },
            on: (event, handler) => {
                if (event === 'end') {
                    handler();
                }
            }
        };

        let statusCode = 0;
        const mockRes = {
            writeHead: (status) => { statusCode = status; },
            end: () => {}
        };

        await xuLyYeuCau(mockReq, mockRes);
        assert.strictEqual(statusCode, 403);
    });

    test.it('Nên thêm sản phẩm thành công nếu là admin', async () => {
        const mockReq = {
            url: '/api/admin/products',
            method: 'POST',
            headers: {
                host: 'localhost',
                cookie: 'session_id=admin_session_id'
            },
            on: (event, handler) => {
                if (event === 'data') {
                    handler(Buffer.from(JSON.stringify({
                        masp: 'new_app_masp',
                        name: 'iPhone 16 Pro',
                        company: 'Apple',
                        price: '30.000.000',
                        promo: { name: 'giamgia', value: '1.000.000' },
                        detail: { screen: 'OLED', os: 'iOS 18' }
                    })));
                }
                if (event === 'end') {
                    handler();
                }
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
        assert.strictEqual(resJson.data.masp, 'new_app_masp');
    });

    test.it('Nên từ chối thêm sản phẩm nếu trùng mã sản phẩm (masp)', async () => {
        const mockReq = {
            url: '/api/admin/products',
            method: 'POST',
            headers: {
                host: 'localhost',
                cookie: 'session_id=admin_session_id'
            },
            on: (event, handler) => {
                if (event === 'data') {
                    handler(Buffer.from(JSON.stringify({
                        masp: 'existed_masp',
                        name: 'iPhone X New',
                        company: 'Apple',
                        price: 25000000
                    })));
                }
                if (event === 'end') {
                    handler();
                }
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
        assert.strictEqual(resJson.error.message, 'Mã sản phẩm đã tồn tại');
    });

    test.it('Nên sửa sản phẩm thành công nếu là admin', async () => {
        const mockReq = {
            url: '/api/admin/products?masp=existed_masp',
            method: 'PUT',
            headers: {
                host: 'localhost',
                cookie: 'session_id=admin_session_id'
            },
            on: (event, handler) => {
                if (event === 'data') {
                    handler(Buffer.from(JSON.stringify({
                        name: 'iPhone X Luxury',
                        price: '35.000.000'
                    })));
                }
                if (event === 'end') {
                    handler();
                }
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
        assert.strictEqual(resJson.data.name, 'iPhone X Luxury');
    });

    test.it('Nên xóa sản phẩm thành công nếu là admin', async () => {
        const mockReq = {
            url: '/api/admin/products?masp=existed_masp',
            method: 'DELETE',
            headers: {
                host: 'localhost',
                cookie: 'session_id=admin_session_id'
            },
            on: (event, handler) => {
                if (event === 'end') {
                    handler();
                }
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
    });

    test.it('Nên trả về 400 khi xóa sản phẩm không tồn tại', async () => {
        const mockReq = {
            url: '/api/admin/products?masp=non_existent_masp',
            method: 'DELETE',
            headers: {
                host: 'localhost',
                cookie: 'session_id=admin_session_id'
            },
            on: (event, handler) => {
                if (event === 'end') {
                    handler();
                }
            }
        };

        let statusCode = 0;
        const mockRes = {
            writeHead: (status) => { statusCode = status; },
            end: () => {}
        };

        await xuLyYeuCau(mockReq, mockRes);
        assert.strictEqual(statusCode, 400);
    });
});
