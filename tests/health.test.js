const test = require('node:test');
const assert = require('node:assert');
const { Readable } = require('node:stream');
const { xuLyYeuCau } = require('../src/app');
const { ketNoiCoSoDuLieu, dongKetNoiCoSoDuLieu } = require('../src/config/database');
const Router = require('../src/http/router');

function taoPhanHoiGia() {
    const ketQua = {
        headers: {},
        body: '',
        statusCode: 0
    };

    const res = {
        headersSent: false,
        writableEnded: false,
        setHeader: (ten, giaTri) => {
            ketQua.headers[ten] = giaTri;
        },
        writeHead: (maTrangThai, headers) => {
            ketQua.statusCode = maTrangThai;
            ketQua.headers = {
                ...ketQua.headers,
                ...headers
            };
            res.headersSent = true;
        },
        end: noiDung => {
            ketQua.body = noiDung || '';
            res.writableEnded = true;
        }
    };

    return {
        ketQua,
        res
    };
}

function taoYeuCauGia(duongDan, phuongThuc = 'GET', noiDung = null) {
    if (noiDung === null) {
        return {
            url: duongDan,
            method: phuongThuc,
            headers: { host: 'localhost' }
        };
    }

    const req = Readable.from([noiDung]);
    req.url = duongDan;
    req.method = phuongThuc;
    req.headers = { host: 'localhost' };
    return req;
}

async function guiYeuCau(boXuLy, req) {
    const { ketQua, res } = taoPhanHoiGia();
    await boXuLy(req, res);
    return {
        ...ketQua,
        json: JSON.parse(ketQua.body)
    };
}

test.describe('Kiểm thử API Health và Router', () => {
    test.before(async () => {
        await ketNoiCoSoDuLieu();
    });

    test.after(async () => {
        await dongKetNoiCoSoDuLieu();
    });

    test.it('Nên trả về trạng thái UP và CONNECTED cho endpoint /api/health', async () => {
        const phanHoi = await guiYeuCau(
            xuLyYeuCau,
            taoYeuCauGia('/api/health')
        );

        assert.strictEqual(phanHoi.statusCode, 200);
        assert.strictEqual(phanHoi.headers['Content-Type'], 'application/json; charset=utf-8');
        assert.strictEqual(phanHoi.json.success, true);
        assert.strictEqual(phanHoi.json.data.status, 'UP');
        assert.strictEqual(phanHoi.json.data.database, 'CONNECTED');
    });

    test.it('Nên trả về lỗi 404 cho một tuyến đường không tồn tại', async () => {
        const phanHoi = await guiYeuCau(
            xuLyYeuCau,
            taoYeuCauGia('/api/tuyen-duong-khong-ton-tai')
        );

        assert.strictEqual(phanHoi.statusCode, 404);
        assert.strictEqual(phanHoi.json.success, false);
        assert.strictEqual(phanHoi.json.error.code, 'NOT_FOUND');
        assert.strictEqual(phanHoi.json.error.message, 'Không tìm thấy API');
    });

    test.it('Nên trả về trạng thái DOWN khi MongoDB mất kết nối', async () => {
        await dongKetNoiCoSoDuLieu();

        const phanHoi = await guiYeuCau(
            xuLyYeuCau,
            taoYeuCauGia('/api/health')
        );

        assert.strictEqual(phanHoi.statusCode, 503);
        assert.strictEqual(phanHoi.json.success, false);
        assert.strictEqual(phanHoi.json.error.code, 'SERVICE_UNAVAILABLE');
        assert.strictEqual(phanHoi.json.error.details.status, 'DOWN');
        assert.strictEqual(phanHoi.json.error.details.database, 'DISCONNECTED');

        await ketNoiCoSoDuLieu();
    });

    test.it('Nên trả về lỗi 405 cho phương thức không được hỗ trợ', async () => {
        const phanHoi = await guiYeuCau(
            xuLyYeuCau,
            taoYeuCauGia('/api/health', 'POST')
        );

        assert.strictEqual(phanHoi.statusCode, 405);
        assert.strictEqual(phanHoi.headers.Allow, 'GET');
        assert.strictEqual(phanHoi.json.error.code, 'METHOD_NOT_ALLOWED');
    });
});

test.describe('Kiểm thử xử lý request của Router', () => {
    test.it('Nên từ chối JSON không hợp lệ', async () => {
        const router = new Router();
        router.post('/api/test', async () => {});

        const phanHoi = await guiYeuCau(
            router.giaiQuyet.bind(router),
            taoYeuCauGia('/api/test', 'POST', '{')
        );

        assert.strictEqual(phanHoi.statusCode, 400);
        assert.strictEqual(phanHoi.json.error.code, 'BAD_REQUEST');
    });

    test.it('Nên từ chối request body vượt quá giới hạn', async () => {
        const router = new Router();
        router.post('/api/test', async () => {});
        const noiDungQuaLon = Buffer.alloc((1024 * 1024) + 1, 'a');

        const phanHoi = await guiYeuCau(
            router.giaiQuyet.bind(router),
            taoYeuCauGia('/api/test', 'POST', noiDungQuaLon)
        );

        assert.strictEqual(phanHoi.statusCode, 413);
        assert.strictEqual(phanHoi.json.error.code, 'PAYLOAD_TOO_LARGE');
    });

    test.it('Không được trả nội dung lỗi nội bộ về client', async () => {
        const router = new Router();
        router.get('/api/test', async () => {
            throw new Error('Thông tin nội bộ nhạy cảm');
        });

        const ghiLoiGoc = console.error;
        let phanHoi;

        try {
            console.error = () => {};
            phanHoi = await guiYeuCau(
                router.giaiQuyet.bind(router),
                taoYeuCauGia('/api/test')
            );
        } finally {
            console.error = ghiLoiGoc;
        }

        assert.strictEqual(phanHoi.statusCode, 500);
        assert.strictEqual(phanHoi.json.error.code, 'INTERNAL_SERVER_ERROR');
        assert.strictEqual(phanHoi.json.error.message, 'Lỗi hệ thống');
        assert.strictEqual(phanHoi.body.includes('Thông tin nội bộ nhạy cảm'), false);
    });
});
