const { guiLoi } = require('./response');

const GIOI_HAN_NOI_DUNG = 1024 * 1024;

function docNoiDungJson(req) {
    return new Promise((resolve, reject) => {
        let noiDung = '';
        let tongSoByte = 0;
        let daQuaGioiHan = false;

        req.on('data', chunk => {
            if (daQuaGioiHan) {
                return;
            }

            tongSoByte += Buffer.byteLength(chunk);

            if (tongSoByte > GIOI_HAN_NOI_DUNG) {
                daQuaGioiHan = true;
                const loi = new Error('Nội dung request vượt quá giới hạn');
                loi.code = 'PAYLOAD_TOO_LARGE';
                reject(loi);
                return;
            }

            noiDung += chunk.toString();
        });

        req.on('end', () => {
            if (daQuaGioiHan) {
                return;
            }

            try {
                resolve(noiDung ? JSON.parse(noiDung) : {});
            } catch (loi) {
                loi.code = 'INVALID_JSON';
                reject(loi);
            }
        });

        req.on('error', reject);
    });
}

class Router {
    constructor() {
        this.dsTuyenDuong = [];
    }

    themTuyenDuong(phuongThuc, duongDan, boXuLy) {
        this.dsTuyenDuong.push({
            phuongThuc: phuongThuc.toUpperCase(),
            duongDan,
            boXuLy
        });
    }

    get(duongDan, boXuLy) {
        this.themTuyenDuong('GET', duongDan, boXuLy);
    }

    post(duongDan, boXuLy) {
        this.themTuyenDuong('POST', duongDan, boXuLy);
    }

    put(duongDan, boXuLy) {
        this.themTuyenDuong('PUT', duongDan, boXuLy);
    }

    patch(duongDan, boXuLy) {
        this.themTuyenDuong('PATCH', duongDan, boXuLy);
    }

    delete(duongDan, boXuLy) {
        this.themTuyenDuong('DELETE', duongDan, boXuLy);
    }

    async giaiQuyet(req, res) {
        let parsedUrl;

        try {
            parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        } catch (loi) {
            guiLoi(res, 'BAD_REQUEST', 'URL không hợp lệ', 400);
            return;
        }

        const duongDanReq = parsedUrl.pathname;
        const phuongThucReq = (req.method || 'GET').toUpperCase();

        const tuyenDuong = this.dsTuyenDuong.find(
            t => t.phuongThuc === phuongThucReq && t.duongDan === duongDanReq
        );

        if (!tuyenDuong) {
            const dsTuyenCungDuongDan = this.dsTuyenDuong.filter(
                t => t.duongDan === duongDanReq
            );

            if (dsTuyenCungDuongDan.length > 0) {
                const dsPhuongThuc = dsTuyenCungDuongDan.map(t => t.phuongThuc);
                res.setHeader('Allow', dsPhuongThuc.join(', '));
                guiLoi(res, 'METHOD_NOT_ALLOWED', 'Phương thức không được hỗ trợ', 405);
                return;
            }

            guiLoi(res, 'NOT_FOUND', 'Không tìm thấy API', 404);
            return;
        }

        req.query = Object.fromEntries(parsedUrl.searchParams);

        if (['POST', 'PUT', 'PATCH'].includes(phuongThucReq)) {
            try {
                req.body = await docNoiDungJson(req);
            } catch (loi) {
                if (loi.code === 'PAYLOAD_TOO_LARGE') {
                    guiLoi(res, 'PAYLOAD_TOO_LARGE', 'Nội dung request vượt quá giới hạn', 413);
                    return;
                }

                guiLoi(res, 'BAD_REQUEST', 'Định dạng JSON không hợp lệ', 400);
                return;
            }
        }

        try {
            await tuyenDuong.boXuLy(req, res);
        } catch (loi) {
            console.error(`Lỗi khi xử lý tuyến đường ${phuongThucReq} ${duongDanReq}:`, loi);
            guiLoi(res, 'INTERNAL_SERVER_ERROR', 'Lỗi hệ thống', 500);
        }
    }
}

module.exports = Router;
