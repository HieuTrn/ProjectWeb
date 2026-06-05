const http = require('http');
const fs = require('fs');
const path = require('path');
const { ketNoiCoSoDuLieu, dongKetNoiCoSoDuLieu } = require('./config/database');
const { xuLyYeuCau } = require('./app');

const THU_MUC_GOC = path.resolve(__dirname, '..');
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function layCongServer() {
    const port = Number(process.env.PORT || 3000);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('PORT phải là số nguyên từ 1 đến 65535');
    }

    return port;
}

function layDuongDanFileTinh(req) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let duongDan = decodeURIComponent(parsedUrl.pathname);

    if (duongDan === '/') {
        duongDan = '/html/index.html';
    }

    if (/^\/[^/]+\.html$/.test(duongDan)) {
        duongDan = '/html' + duongDan;
    }

    const duongDanFile = path.resolve(THU_MUC_GOC, duongDan.replace(/^\/+/, ''));
    const namTrongThuMucGoc = duongDanFile === THU_MUC_GOC || duongDanFile.startsWith(THU_MUC_GOC + path.sep);

    if (!namTrongThuMucGoc) {
        return null;
    }

    return duongDanFile;
}

async function phucVuFileTinh(req, res) {
    if ((req.method || 'GET').toUpperCase() !== 'GET') {
        return false;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (parsedUrl.pathname.startsWith('/api')) {
        return false;
    }

    const duongDanFile = layDuongDanFileTinh(req);
    if (!duongDanFile) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return true;
    }

    try {
        const thongTinFile = await fs.promises.stat(duongDanFile);
        if (!thongTinFile.isFile()) {
            return false;
        }

        const duoiFile = path.extname(duongDanFile).toLowerCase();
        const noiDung = await fs.promises.readFile(duongDanFile);
        res.writeHead(200, {
            'Content-Type': MIME_TYPES[duoiFile] || 'application/octet-stream',
            'Cache-Control': 'no-store'
        });
        res.end(noiDung);
        return true;
    } catch (loi) {
        if (loi.code === 'ENOENT') {
            return false;
        }

        console.error('Không thể phục vụ file tĩnh:', loi);
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Lỗi hệ thống');
        return true;
    }
}

async function khoiDongServer() {
    try {
        const port = layCongServer();
        await ketNoiCoSoDuLieu();

        const server = http.createServer((req, res) => {
            const origin = req.headers.origin || '*';
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.setHeader('Access-Control-Allow-Credentials', 'true');

            if (req.method === 'OPTIONS') {
                res.writeHead(204, {
                    'Access-Control-Allow-Origin': origin,
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Allow-Credentials': 'true'
                });
                res.end();
                return;
            }

            void (async () => {
                if (await phucVuFileTinh(req, res)) {
                    return;
                }

                await xuLyYeuCau(req, res);
            })().catch(loi => {
                console.error('Request kết thúc ngoài dự kiến:', loi);
            });
        });

        server.once('error', async loi => {
            console.error('HTTP server không thể khởi động:', loi);

            try {
                await dongKetNoiCoSoDuLieu();
            } finally {
                process.exit(1);
            }
        });

        server.listen(port, () => {
            console.log(`Server đang chạy tại http://localhost:${port}`);
            console.log(`Mở web tại http://localhost:${port}/`);
        });

        let dangDungServer = false;

        const dungServer = async () => {
            if (dangDungServer) {
                return;
            }

            dangDungServer = true;
            console.log('\nĐang tắt server...');

            server.close(async loi => {
                try {
                    await dongKetNoiCoSoDuLieu();
                    console.log('Server đã dừng hoạt động.');
                    process.exit(loi ? 1 : 0);
                } catch (loiDongKetNoi) {
                    console.error('Không thể dừng server an toàn:', loiDongKetNoi);
                    process.exit(1);
                }
            });
        };

        process.on('SIGINT', dungServer);
        process.on('SIGTERM', dungServer);
    } catch (loi) {
        console.error('Không thể khởi động hệ thống.');
        process.exit(1);
    }
}

khoiDongServer();
