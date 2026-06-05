function guiJson(res, noiDung, maTrangThai, headersTuyChinh = {}) {
    if (res.headersSent || res.writableEnded) {
        return;
    }

    const layHeader = typeof res.getHeader === 'function'
        ? tenHeader => res.getHeader(tenHeader)
        : () => null;

    res.writeHead(maTrangThai, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': layHeader('Access-Control-Allow-Origin') || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': layHeader('Access-Control-Allow-Credentials') || 'true',
        ...headersTuyChinh
    });
    res.end(JSON.stringify(noiDung));
}

function guiThanhCong(res, duLieu = null, maTrangThai = 200, headersTuyChinh = {}) {
    guiJson(res, {
        success: true,
        data: duLieu
    }, maTrangThai, headersTuyChinh);
}

function guiLoi(res, maLoi, thongDiep, maTrangThai = 500, chiTiet = null, headersTuyChinh = {}) {
    const loi = {
        code: maLoi,
        message: thongDiep
    };

    if (chiTiet !== null) {
        loi.details = chiTiet;
    }

    guiJson(res, {
        success: false,
        error: loi
    }, maTrangThai, headersTuyChinh);
}

module.exports = {
    guiThanhCong,
    guiLoi
};
