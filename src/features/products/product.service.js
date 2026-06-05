const Product = require('./product.model');

function escapeRegExp(chuoi) {
    return chuoi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function chuanHoaGia(gia) {
    if (typeof gia === 'number') return gia;
    if (typeof gia === 'string') {
        const giaSo = parseInt(gia.split('.').join(''), 10);
        if (isNaN(giaSo)) throw new Error('Giá sản phẩm không hợp lệ');
        return giaSo;
    }
    throw new Error('Giá sản phẩm không hợp lệ');
}

function chuanHoaSoLuongTon(stock) {
    if (stock === undefined || stock === null || stock === '') return 100;
    const soLuong = Number.parseInt(stock, 10);
    if (!Number.isInteger(soLuong) || soLuong < 0) {
        throw new Error('Số lượng sản phẩm phải là số nguyên không âm');
    }
    return soLuong;
}

async function layDanhSachSanPham() {
    return await Product.find({}).lean();
}

async function layChiTietSanPhamTheoMasp(masp) {
    return await Product.findOne({ masp }).lean();
}

async function layChiTietSanPhamTheoTen(tenSp) {
    if (!tenSp) return null;
    const tenChuan = tenSp.trim();
    const sanPham = await Product.findOne({
        name: { $regex: new RegExp(`^${escapeRegExp(tenChuan)}$`, 'i') }
    }).lean();

    if (sanPham) return sanPham;

    const danhSachSanPham = await Product.find({}).lean();
    return danhSachSanPham.find(p => p.name.split(' ').join('-') === tenChuan) || null;
}

async function themSanPham(duLieu) {
    const { masp, name, company, img, price, stock, star, rateCount, promo, detail } = duLieu;
    if (!masp) throw new Error('Thiếu mã sản phẩm');

    const maspChuan = masp.trim();
    const productExist = await Product.findOne({ masp: maspChuan });
    if (productExist) {
        throw new Error('Mã sản phẩm đã tồn tại');
    }

    const nameChuan = (name || '').trim();
    const productByNameExist = await Product.findOne({ name: { $regex: new RegExp(`^${escapeRegExp(nameChuan)}$`, 'i') } });
    if (productByNameExist) {
        throw new Error('Tên sản phẩm đã tồn tại');
    }

    const priceChuan = chuanHoaGia(price);

    const newProduct = new Product({
        masp: maspChuan,
        name: nameChuan,
        company: (company || '').trim(),
        img: (img || '').trim(),
        price: priceChuan,
        stock: chuanHoaSoLuongTon(stock),
        star: Number(star) || 0,
        rateCount: Number(rateCount) || 0,
        promo: {
            name: (promo && promo.name) || '',
            value: (promo && promo.value) || ''
        },
        detail: {
            screen: (detail && detail.screen) || '',
            os: (detail && detail.os) || '',
            camara: (detail && detail.camara) || '',
            camaraFront: (detail && detail.camaraFront) || '',
            cpu: (detail && detail.cpu) || '',
            ram: (detail && detail.ram) || '',
            rom: (detail && detail.rom) || '',
            microUSB: (detail && detail.microUSB) || '',
            battery: (detail && detail.battery) || ''
        }
    });

    return await newProduct.save();
}

async function suaSanPham(maspCu, duLieu) {
    const product = await Product.findOne({ masp: maspCu });
    if (!product) {
        throw new Error('Không tìm thấy sản phẩm cần sửa');
    }

    const { masp, name, company, img, price, stock, star, rateCount, promo, detail } = duLieu;
    const maspChuan = (masp || maspCu).trim();

    if (maspChuan !== maspCu) {
        const productExist = await Product.findOne({ masp: maspChuan });
        if (productExist) {
            throw new Error('Mã sản phẩm mới đã tồn tại');
        }
    }

    const nameChuan = (name || '').trim();
    if (nameChuan && nameChuan.toLowerCase() !== product.name.toLowerCase()) {
        const productByNameExist = await Product.findOne({ name: { $regex: new RegExp(`^${escapeRegExp(nameChuan)}$`, 'i') } });
        if (productByNameExist) {
            throw new Error('Tên sản phẩm mới đã tồn tại');
        }
    }

    const capNhat = {
        masp: maspChuan
    };
    if (name) capNhat.name = nameChuan;
    if (company) capNhat.company = company.trim();
    if (img) capNhat.img = img.trim();
    if (price !== undefined) capNhat.price = chuanHoaGia(price);
    if (stock !== undefined) capNhat.stock = chuanHoaSoLuongTon(stock);
    if (star !== undefined) capNhat.star = Number(star) || 0;
    if (rateCount !== undefined) capNhat.rateCount = Number(rateCount) || 0;
    
    if (promo) {
        capNhat.promo = {
            name: promo.name || '',
            value: promo.value || ''
        };
    }
    if (detail) {
        capNhat.detail = {
            screen: detail.screen || '',
            os: detail.os || '',
            camara: detail.camara || '',
            camaraFront: detail.camaraFront || '',
            cpu: detail.cpu || '',
            ram: detail.ram || '',
            rom: detail.rom || '',
            microUSB: detail.microUSB || '',
            battery: detail.battery || ''
        };
    }

    return await Product.findOneAndUpdate(
        { masp: maspCu },
        { $set: capNhat },
        { new: true, runValidators: true }
    ).lean();
}

async function xoaSanPham(masp) {
    const result = await Product.deleteOne({ masp });
    if (result.deletedCount === 0) {
        throw new Error('Không tìm thấy sản phẩm cần xóa');
    }
    return result;
}

module.exports = {
    layDanhSachSanPham,
    layChiTietSanPhamTheoMasp,
    layChiTietSanPhamTheoTen,
    themSanPham,
    suaSanPham,
    xoaSanPham
};
