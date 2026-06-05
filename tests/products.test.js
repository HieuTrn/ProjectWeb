const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const { xuLyYeuCau } = require('../src/app');
const Product = require('../src/features/products/product.model');

test.describe('Kiểm thử API Sản phẩm', () => {
    let originalFind;
    let originalFindOne;
    let originalReadyState;

    test.before(() => {
        originalFind = Product.find;
        originalFindOne = Product.findOne;
        originalReadyState = mongoose.connection.readyState;
        mongoose.connection.readyState = 1;

        Product.find = () => {
            return {
                lean: async () => [
                    { masp: 'App0', name: 'iPhone X 256GB Silver', price: 31990000, company: 'Apple' }
                ]
            };
        };

        Product.findOne = (query) => {
            let matched = null;
            if (query.masp === 'Sam0') {
                matched = { masp: 'Sam0', name: 'SamSung Galaxy J4+', price: 3490000, company: 'Samsung' };
            } else if (query.masp === 'App0') {
                matched = { masp: 'App0', name: 'iPhone X 256GB Silver', price: 31990000, company: 'Apple' };
            } else if (query.name && query.name.$regex) {
                matched = { masp: 'Opp0', name: 'Oppo F9', price: 7690000, company: 'Oppo' };
            }
            return {
                lean: async () => matched
            };
        };
    });

    test.after(() => {
        Product.find = originalFind;
        Product.findOne = originalFindOne;
        mongoose.connection.readyState = originalReadyState;
    });

    test.it('Nên lấy danh sách toàn bộ sản phẩm', async () => {
        const mockReq = {
            url: '/api/products',
            method: 'GET',
            headers: { host: 'localhost' }
        };

        let responseHeaders = {};
        let responseBody = '';
        let statusCode = 0;

        const mockRes = {
            writeHead: (status, headers) => {
                statusCode = status;
                responseHeaders = headers;
            },
            end: (data) => {
                responseBody = data;
            }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 200);
        assert.strictEqual(responseHeaders['Content-Type'].includes('application/json'), true);

        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, true);
        assert.ok(Array.isArray(resJson.data));
        assert.ok(resJson.data.length > 0);
        assert.strictEqual(typeof resJson.data[0].price, 'number');
    });

    test.it('Nên lấy chi tiết sản phẩm theo mã sản phẩm (masp)', async () => {
        const mockReq = {
            url: '/api/products/detail?masp=Sam0',
            method: 'GET',
            headers: { host: 'localhost' }
        };

        let responseBody = '';
        let statusCode = 0;

        const mockRes = {
            writeHead: (status) => {
                statusCode = status;
            },
            end: (data) => {
                responseBody = data;
            }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 200);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, true);
        assert.strictEqual(resJson.data.masp, 'Sam0');
        assert.strictEqual(resJson.data.name, 'SamSung Galaxy J4+');
    });

    test.it('Nên lấy chi tiết sản phẩm theo tên (name) dạng gạch ngang từ frontend', async () => {
        const mockReq = {
            url: '/api/products/detail?name=Oppo-F9',
            method: 'GET',
            headers: { host: 'localhost' }
        };

        let responseBody = '';
        let statusCode = 0;

        const mockRes = {
            writeHead: (status) => {
                statusCode = status;
            },
            end: (data) => {
                responseBody = data;
            }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 200);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, true);
        assert.strictEqual(resJson.data.masp, 'Opp0');
        assert.strictEqual(resJson.data.name, 'Oppo F9');
    });

    test.it('Nên trả về 404 khi sản phẩm không tồn tại', async () => {
        const mockReq = {
            url: '/api/products/detail?masp=KhongTonTaiMasp',
            method: 'GET',
            headers: { host: 'localhost' }
        };

        let responseBody = '';
        let statusCode = 0;

        const mockRes = {
            writeHead: (status) => {
                statusCode = status;
            },
            end: (data) => {
                responseBody = data;
            }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 404);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, false);
        assert.strictEqual(resJson.error.code, 'NOT_FOUND');
    });

    test.it('Nên từ chối lấy sản phẩm khi MongoDB chưa sẵn sàng', async () => {
        mongoose.connection.readyState = 0;

        const mockReq = {
            url: '/api/products',
            method: 'GET',
            headers: { host: 'localhost' }
        };

        let responseBody = '';
        let statusCode = 0;

        const mockRes = {
            writeHead: (status) => {
                statusCode = status;
            },
            end: (data) => {
                responseBody = data;
            }
        };

        await xuLyYeuCau(mockReq, mockRes);
        mongoose.connection.readyState = 1;

        assert.strictEqual(statusCode, 503);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, false);
        assert.strictEqual(resJson.error.code, 'SERVICE_UNAVAILABLE');
    });
});
