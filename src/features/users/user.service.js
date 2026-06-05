const crypto = require('crypto');
const User = require('./user.model');
const Session = require('./session.model');

function maHoaMatKhau(matKhau) {
    return crypto.createHash('sha256').update(matKhau).digest('hex');
}

async function dangKy(duLieuUser) {
    const { username, pass, ho, ten, email } = duLieuUser;
    
    const userExist = await User.findOne({ username: username.trim() });
    if (userExist) {
        throw new Error('Tên đăng nhập đã tồn tại');
    }

    const matKhauHash = maHoaMatKhau(pass);
    const newUser = new User({
        username: username.trim(),
        pass: matKhauHash,
        ho: ho || '',
        ten: ten || '',
        email: email || '',
        role: 'user'
    });

    const savedUser = await newUser.save();
    const userObj = savedUser.toObject();
    delete userObj.pass;
    return userObj;
}

async function dangNhap(username, pass) {
    const user = await User.findOne({ username: username.trim() });
    if (!user) {
        throw new Error('Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    if (user.off) {
        throw new Error('Tài khoản đã bị khóa');
    }

    const matKhauHash = maHoaMatKhau(pass);
    if (user.pass !== matKhauHash) {
        throw new Error('Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const sessionObj = new Session({
        sessionId,
        userId: user._id,
        expiresAt
    });

    await sessionObj.save();

    const userObj = user.toObject();
    delete userObj.pass;
    return {
        sessionId,
        user: userObj
    };
}

async function dangXuat(sessionId) {
    if (sessionId) {
        await Session.deleteOne({ sessionId });
    }
}

async function layUserTuSession(sessionId) {
    if (!sessionId) return null;

    const session = await Session.findOne({
        sessionId,
        expiresAt: { $gt: new Date() }
    });

    if (!session) return null;

    const user = await User.findById(session.userId).lean();
    if (!user || user.off) return null;

    delete user.pass;
    return user;
}

async function layDanhSachKhachHangAdmin() {
    return await User.find({ role: 'user' }).select('-pass').lean();
}

async function capNhatTrangThaiKhoaAdmin(username, off) {
    const user = await User.findOneAndUpdate(
        { username, role: 'user' },
        { off },
        { new: true, runValidators: true }
    );
    if (!user) {
        throw new Error('Không tìm thấy người dùng');
    }
    const userObj = user.toObject();
    delete userObj.pass;
    return userObj;
}

async function xoaKhachHangAdmin(username) {
    const user = await User.findOne({ username, role: 'user' });
    if (!user) {
        throw new Error('Không tìm thấy người dùng');
    }
    await User.deleteOne({ _id: user._id });
    const Order = require('../orders/order.model');
    await Order.deleteMany({ userId: user._id });
    const Cart = require('../carts/cart.model');
    await Cart.deleteOne({ userId: user._id });
    await Session.deleteMany({ userId: user._id });
}

async function capNhatThongTinCaNhan(userId, { ho, ten, email }) {
    const user = await User.findByIdAndUpdate(
        userId,
        { ho, ten, email },
        { new: true, runValidators: true }
    );
    if (!user) {
        throw new Error('Không tìm thấy người dùng');
    }
    const userObj = user.toObject();
    delete userObj.pass;
    return userObj;
}

async function doiMatKhau(userId, passCu, passMoi) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('Không tìm thấy người dùng');
    }
    const passCuHash = maHoaMatKhau(passCu);
    if (user.pass !== passCuHash) {
        throw new Error('Mật khẩu cũ không chính xác');
    }
    user.pass = maHoaMatKhau(passMoi);
    await user.save();
}

module.exports = {
    maHoaMatKhau,
    dangKy,
    dangNhap,
    dangXuat,
    layUserTuSession,
    layDanhSachKhachHangAdmin,
    capNhatTrangThaiKhoaAdmin,
    xoaKhachHangAdmin,
    capNhatThongTinCaNhan,
    doiMatKhau
};
