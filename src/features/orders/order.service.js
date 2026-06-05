const Order = require('./order.model');
const Cart = require('../carts/cart.model');
const Product = require('../products/product.model');

function tinhGiaThucTe(sanPham) {
    if (sanPham.promo && sanPham.promo.name === 'giareonline' && sanPham.promo.value) {
        const giaPromo = parseInt(String(sanPham.promo.value).split('.').join(''), 10);
        if (!isNaN(giaPromo) && giaPromo > 0) return giaPromo;
    }
    return sanPham.price;
}

async function taoDonHang(userId, idempotencyKey) {
    if (idempotencyKey) {
        const donCu = await Order.findOne({ userId, idempotencyKey }).lean();
        if (donCu) return donCu;
    }

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
        throw new Error('Giỏ hàng trống, không thể tạo đơn hàng');
    }

    const dsMasp = cart.items.map(item => item.masp);
    const dsSanPham = await Product.find({ masp: { $in: dsMasp } }).lean();
    const banDoSanPham = {};
    for (const sp of dsSanPham) {
        banDoSanPham[sp.masp] = sp;
    }

    const dsItemsDon = [];
    for (const item of cart.items) {
        if (!Number.isInteger(item.soluong) || item.soluong <= 0) {
            throw new Error(`Số lượng sản phẩm ${item.masp} không hợp lệ`);
        }

        const sp = banDoSanPham[item.masp];
        if (!sp) {
            throw new Error(`Sản phẩm ${item.masp} không tồn tại trên hệ thống`);
        }
        if (sp.stock < item.soluong) {
            throw new Error(`Sản phẩm "${sp.name}" chỉ còn ${sp.stock} trong kho, không đủ ${item.soluong}`);
        }
        const gia = tinhGiaThucTe(sp);
        dsItemsDon.push({
            masp: sp.masp,
            name: sp.name,
            img: sp.img,
            gia,
            soluong: item.soluong,
            thanhTien: gia * item.soluong
        });
    }

    const dsMaspDaGiam = [];
    try {
        for (const item of dsItemsDon) {
            const ketQua = await Product.updateOne(
                { masp: item.masp, stock: { $gte: item.soluong } },
                { $inc: { stock: -item.soluong } }
            );
            if (ketQua.modifiedCount === 0) {
                throw new Error(`Không thể giảm tồn kho cho sản phẩm "${item.name}", có thể đã hết hàng`);
            }
            dsMaspDaGiam.push({ masp: item.masp, soluong: item.soluong });
        }

        const tongTien = dsItemsDon.reduce((tong, item) => tong + item.thanhTien, 0);
        const donMoi = new Order({
            userId,
            idempotencyKey: idempotencyKey || undefined,
            items: dsItemsDon,
            tongTien,
            tinhTrang: 'Đang chờ xử lý',
            ngayMua: new Date()
        });

        const donDaLuu = await donMoi.save();

        cart.items = [];
        await cart.save();

        return donDaLuu.toObject();
    } catch (loi) {
        for (const item of dsMaspDaGiam) {
            await Product.updateOne(
                { masp: item.masp },
                { $inc: { stock: item.soluong } }
            );
        }
        throw loi;
    }
}

async function layDanhSachDonHang(userId) {
    return await Order.find({ userId }).sort({ ngayMua: -1 }).lean();
}

async function layChiTietDonHang(orderId, userId) {
    return await Order.findOne({ _id: orderId, userId }).lean();
}

async function layDanhSachDonHangAdmin() {
    const orders = await Order.find({}).sort({ ngayMua: -1 }).lean();
    const userIds = [...new Set(orders.map(o => o.userId))];
    const User = require('../users/user.model');
    const users = await User.find({ _id: { $in: userIds } }).select('username').lean();
    const mapUser = {};
    for (const u of users) {
        mapUser[u._id.toString()] = u.username;
    }
    return orders.map(o => ({
        ...o,
        khachhang: mapUser[o.userId.toString()] || 'Ẩn danh'
    }));
}

async function duyetDonHangAdmin(orderId, duyetDon) {
    const donHang = await Order.findById(orderId);
    if (!donHang) {
        throw new Error('Không tìm thấy đơn hàng');
    }

    if (duyetDon) {
        if (donHang.tinhTrang === 'Đã hủy') {
            throw new Error('Không thể duyệt đơn đã hủy');
        }
        donHang.tinhTrang = 'Đã giao hàng';
        await donHang.save();
    } else {
        if (donHang.tinhTrang === 'Đã giao hàng') {
            throw new Error('Không thể hủy đơn hàng đã giao');
        }
        if (donHang.tinhTrang !== 'Đã hủy') {
            donHang.tinhTrang = 'Đã hủy';
            await donHang.save();
            for (const item of donHang.items) {
                await Product.updateOne(
                    { masp: item.masp },
                    { $inc: { stock: item.soluong } }
                );
            }
        }
    }
    return donHang.toObject();
}

async function layThongKeAdmin() {
    const orders = await Order.find({ tinhTrang: { $ne: 'Đã hủy' } }).lean();
    const dsMasp = [];
    for (const don of orders) {
        for (const item of don.items) {
            if (!dsMasp.includes(item.masp)) {
                dsMasp.push(item.masp);
            }
        }
    }
    const dsSanPham = await Product.find({ masp: { $in: dsMasp } }).select('masp company').lean();
    const mapMaspToCompany = {};
    for (const sp of dsSanPham) {
        mapMaspToCompany[sp.masp] = sp.company;
    }
    const thongKeHang = {};
    for (const don of orders) {
        for (const item of don.items) {
            const tenHang = mapMaspToCompany[item.masp] || 'Khác';
            if (!thongKeHang[tenHang]) {
                thongKeHang[tenHang] = {
                    soLuongBanRa: 0,
                    doanhThu: 0
                };
            }
            thongKeHang[tenHang].soLuongBanRa += item.soluong;
            thongKeHang[tenHang].doanhThu += item.thanhTien;
        }
    }
    return thongKeHang;
}

module.exports = {
    taoDonHang,
    layDanhSachDonHang,
    layChiTietDonHang,
    layDanhSachDonHangAdmin,
    duyetDonHangAdmin,
    layThongKeAdmin
};
