const Cart = require('./cart.model');
const Product = require('../products/product.model');

function kiemTraSoLuongHopLe(soluong) {
    return Number.isInteger(soluong) && soluong > 0;
}

async function layGioHang(userId) {
    let cart = await Cart.findOne({ userId });
    if (!cart) {
        cart = new Cart({ userId, items: [] });
        await cart.save();
    }

    const dsMasp = cart.items.map(item => item.masp);
    const dsSanPham = await Product.find({ masp: { $in: dsMasp } }).lean();
    const banDoSanPham = dsSanPham.reduce((map, sp) => {
        map[sp.masp] = sp;
        return map;
    }, {});

    const ketQua = cart.items.map(item => {
        const sp = banDoSanPham[item.masp];
        return {
            masp: item.masp,
            soluong: item.soluong,
            date: item.date,
            sanPham: sp ? {
                name: sp.name,
                img: sp.img,
                price: sp.price,
                promo: sp.promo
            } : null
        };
    }).filter(item => item.sanPham !== null);

    return ketQua;
}

async function themVaoGioHang(userId, masp, soluong = 1) {
    if (!kiemTraSoLuongHopLe(soluong)) {
        throw new Error('Số lượng sản phẩm không hợp lệ');
    }

    const spExist = await Product.findOne({ masp });
    if (!spExist) {
        throw new Error('Sản phẩm không tồn tại trên hệ thống');
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
        cart = new Cart({ userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.masp === masp);
    if (itemIndex > -1) {
        cart.items[itemIndex].soluong += soluong;
        cart.items[itemIndex].date = new Date();
    } else {
        cart.items.push({ masp, soluong, date: new Date() });
    }

    await cart.save();
    return await layGioHang(userId);
}

async function capNhatSoLuong(userId, masp, soluong) {
    if (!Number.isInteger(soluong)) {
        throw new Error('Số lượng sản phẩm không hợp lệ');
    }

    if (soluong <= 0) {
        return await xoaKhoiGioHang(userId, masp);
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
        throw new Error('Giỏ hàng không tồn tại');
    }

    const itemIndex = cart.items.findIndex(item => item.masp === masp);
    if (itemIndex > -1) {
        cart.items[itemIndex].soluong = soluong;
        await cart.save();
    } else {
        throw new Error('Sản phẩm không có trong giỏ hàng');
    }

    return await layGioHang(userId);
}

async function xoaKhoiGioHang(userId, masp) {
    let cart = await Cart.findOne({ userId });
    if (!cart) {
        throw new Error('Giỏ hàng không tồn tại');
    }

    cart.items = cart.items.filter(item => item.masp !== masp);
    await cart.save();
    return await layGioHang(userId);
}

async function lamSachGioHang(userId) {
    let cart = await Cart.findOne({ userId });
    if (cart) {
        cart.items = [];
        await cart.save();
    }
    return [];
}

module.exports = {
    layGioHang,
    themVaoGioHang,
    capNhatSoLuong,
    xoaKhoiGioHang,
    lamSachGioHang
};
