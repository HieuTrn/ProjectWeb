const mongoose = require('mongoose');

mongoose.set('bufferCommands', false);

async function ketNoiCoSoDuLieu() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error('Thiếu biến môi trường MONGODB_URI');
    }

    if (mongoose.connection.readyState === 1) {
        return;
    }

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('Kết nối MongoDB thành công thông qua Mongoose.');
    } catch (loi) {
        console.error('Không thể kết nối MongoDB.');
        throw loi;
    }
}

async function dongKetNoiCoSoDuLieu() {
    if (mongoose.connection.readyState === 0) {
        return;
    }

    try {
        await mongoose.disconnect();
        console.log('Đã đóng kết nối MongoDB.');
    } catch (loi) {
        console.error('Lỗi khi đóng kết nối MongoDB:', loi);
        throw loi;
    }
}

module.exports = {
    ketNoiCoSoDuLieu,
    dongKetNoiCoSoDuLieu
};
