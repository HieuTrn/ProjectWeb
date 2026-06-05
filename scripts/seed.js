const mongoose = require('mongoose');
const crypto = require('crypto');
const Product = require('../src/features/products/product.model');
const User = require('../src/features/users/user.model');

function maHoaMatKhau(matKhau) {
    return crypto.createHash('sha256').update(matKhau).digest('hex');
}

const dsApple = [
    {
        masp: 'App0',
        name: 'iPhone X 256GB Silver',
        company: 'iPhone',
        img: 'img/products/iphone-x-256gb-silver-400x400.jpg',
        price: 31990000,
        star: 4,
        rateCount: 10,
        promo: {
            name: 'giareonline',
            value: '27.990.000'
        },
        detail: {
            screen: "OLED, 5.8', Super Retina",
            os: 'iOS 11',
            camara: '2 camera 12 MP',
            camaraFront: '7 MP',
            cpu: 'Apple A11 Bionic 6 nhân',
            ram: '3 GB',
            rom: '256 GB',
            microUSB: 'Không',
            battery: '2716 mAh, có sạc nhanh'
        },
        stock: 100
    },
    {
        masp: 'App1',
        name: 'iPad 2018 Wifi 32GB',
        company: 'iPad',
        img: 'img/products/ipad-wifi-32gb-2018-thumb-600x600.jpg',
        price: 8990000,
        star: 0,
        rateCount: 0,
        promo: {
            name: 'tragop',
            value: '0'
        },
        detail: {
            screen: "LED-backlit LCD, 9.7''",
            os: 'iOS 11.3',
            camara: '8 MP',
            camaraFront: '1.2 MP',
            cpu: 'Apple A10 Fusion, 2.34 GHz',
            ram: '2 GB',
            rom: '32 GB',
            microUSB: 'Không',
            battery: 'Chưa có thông số cụ thể'
        },
        stock: 100
    },
    {
        masp: 'App2',
        name: 'iPhone 7 Plus 32GB',
        company: 'iPhone',
        img: 'img/products/iphone-7-plus-32gb-hh-600x600.jpg',
        price: 17000000,
        star: 0,
        rateCount: 0,
        promo: {
            name: 'giareonline',
            value: '16.990.000'
        },
        detail: {
            screen: "LED-backlit IPS LCD, 5.5', Retina HD",
            os: 'iOS 11',
            camara: '2 camera 12 MP',
            camaraFront: '7 MP',
            cpu: 'Apple A10 Fusion 4 nhân 64-bit',
            ram: '3 GB',
            rom: '32 GB',
            microUSB: 'Không',
            battery: '2900 mAh'
        },
        stock: 100
    },
    {
        masp: 'App3',
        name: 'iPhone Xr 128GB',
        company: 'iPhone',
        img: 'https://cdn.tgdd.vn/Products/Images/42/191483/iphone-xr-128gb-red-600x600.jpg',
        price: 24990000,
        star: 0,
        rateCount: 0,
        promo: {
            name: 'giareonline',
            value: '22.990.000'
        },
        detail: {
            screen: 'IPS LCD, 6.1\', IPS LCD, 16 triệu màu',
            os: 'iOS 12',
            camara: '12 MP',
            camaraFront: '7 MP',
            cpu: 'Apple A12 Bionic 6 nhân',
            ram: '3 GB',
            rom: '128 GB',
            microUSB: 'Không',
            battery: '2942 mAh, có sạc nhanh'
        },
        stock: 100
    },
    {
        masp: 'App4',
        name: 'iPhone 8 Plus 64GB',
        company: 'iPhone',
        img: 'https://cdn.tgdd.vn/Products/Images/42/114110/iphone-8-plus-hh-600x600.jpg',
        price: 20990000,
        star: 5,
        rateCount: 230,
        promo: {
            name: 'tragop',
            value: '0'
        },
        detail: {
            screen: "LED-backlit IPS LCD, 5.5', Retina HD",
            os: 'iOS 11',
            camara: '2 camera 12 MP',
            camaraFront: '7 MP',
            cpu: 'Apple A11 Bionic 6 nhân',
            ram: '3 GB',
            rom: '64 GB',
            microUSB: 'Không',
            battery: '2691 mAh, có sạc nhanh'
        },
        stock: 100
    },
    {
        masp: 'App5',
        name: 'iPhone 8 Plus 256GB',
        company: 'iPhone',
        img: 'https://cdn.tgdd.vn/Products/Images/42/114114/iphone-8-plus-256gb-red-600x600.jpg',
        price: 25790000,
        star: 5,
        rateCount: 16,
        promo: {
            name: 'giamgia',
            value: '500.000'
        },
        detail: {
            screen: "LED-backlit IPS LCD, 4.7', Retina HD",
            os: 'iOS 11',
            camara: '12 MP',
            camaraFront: '7 MP',
            cpu: 'Apple A11 Bionic 6 nhân',
            ram: '2 GB',
            rom: '256 GB',
            microUSB: 'Không',
            battery: '1821 mAh, có sạc nhanh'
        },
        stock: 100
    },
    {
        masp: 'App6',
        name: 'iPhone Xr 64GB',
        company: 'iPhone',
        img: 'https://cdn.tgdd.vn/Products/Images/42/190325/iphone-xr-black-400x460.png',
        price: 22990000,
        star: 4,
        rateCount: 5,
        promo: {
            name: 'giareonline',
            value: '19.990.000'
        },
        detail: {
            screen: 'IPS LCD, 6.1\', IPS LCD, 16 triệu màu',
            os: 'iOS 12',
            camara: '12 MP',
            camaraFront: '7 MP',
            cpu: 'Apple A12 Bionic 6 nhân',
            ram: '3 GB',
            rom: '64 GB',
            microUSB: 'Không',
            battery: '2942 mAh, có sạc nhanh'
        },
        stock: 100
    },
    {
        masp: 'App7',
        name: 'AirPods 2',
        company: 'AirPods',
        img: 'img/products/airpods-2.webp',
        price: 2990000,
        star: 5,
        rateCount: 12,
        promo: {
            name: 'giamgia',
            value: '300.000'
        },
        detail: {
            screen: 'Không',
            os: 'iOS/Android',
            camara: 'Không',
            camaraFront: 'Không',
            cpu: 'Apple H1',
            ram: 'Không',
            rom: 'Không',
            microUSB: 'Lightning',
            battery: '5 giờ nghe nhạc'
        },
        stock: 100
    },
    {
        masp: 'App8',
        name: 'AirPods 3',
        company: 'AirPods',
        img: 'img/products/airpods3.webp',
        price: 4490000,
        star: 4,
        rateCount: 8,
        promo: {
            name: 'tragop',
            value: '0'
        },
        detail: {
            screen: 'Không',
            os: 'iOS/Android',
            camara: 'Không',
            camaraFront: 'Không',
            cpu: 'Apple H1',
            ram: 'Không',
            rom: 'Không',
            microUSB: 'Lightning/MagSafe',
            battery: '6 giờ nghe nhạc'
        },
        stock: 100
    },
    {
        masp: 'App9',
        name: 'AirPods 4',
        company: 'AirPods',
        img: 'img/products/airpods-4.webp',
        price: 4790000,
        star: 5,
        rateCount: 25,
        promo: {
            name: 'moiramat',
            value: ''
        },
        detail: {
            screen: 'Không',
            os: 'iOS/Android',
            camara: 'Không',
            camaraFront: 'Không',
            cpu: 'Apple H2',
            ram: 'Không',
            rom: 'Không',
            microUSB: 'Type-C',
            battery: '30 giờ kèm hộp sạc'
        },
        stock: 100
    },
    {
        masp: 'App10',
        name: 'AirPods Max',
        company: 'AirPods',
        img: 'img/products/airpods_max.webp',
        price: 13990000,
        star: 5,
        rateCount: 5,
        promo: {
            name: 'giamgia',
            value: '1.000.000'
        },
        detail: {
            screen: 'Không',
            os: 'iOS/Android',
            camara: 'Không',
            camaraFront: 'Không',
            cpu: 'Apple H1 (mỗi bên tai)',
            ram: 'Không',
            rom: 'Không',
            microUSB: 'Lightning',
            battery: '20 giờ chống ồn chủ động'
        },
        stock: 100
    },
    {
        masp: 'App11',
        name: 'iPad 10.9-inch (Gen 10) Wifi',
        company: 'iPad',
        img: 'img/products/ipad-a16.webp',
        price: 10990000,
        star: 5,
        rateCount: 18,
        promo: {
            name: 'giamgia',
            value: '500.000'
        },
        detail: {
            screen: 'Liquid Retina 10.9-inch',
            os: 'iPadOS 16',
            camara: '12 MP',
            camaraFront: '12 MP',
            cpu: 'Apple A14 Bionic',
            ram: '4 GB',
            rom: '64 GB',
            microUSB: 'Type-C',
            battery: '28.6 Wh'
        },
        stock: 100
    },
    {
        masp: 'App12',
        name: 'iPad Air 11-inch M2',
        company: 'iPad',
        img: 'img/products/ipad-air-11.webp',
        price: 16990000,
        star: 5,
        rateCount: 10,
        promo: {
            name: 'tragop',
            value: '0'
        },
        detail: {
            screen: 'Liquid Retina 11-inch',
            os: 'iPadOS 17',
            camara: '12 MP',
            camaraFront: '12 MP',
            cpu: 'Apple M2 8 nhân',
            ram: '8 GB',
            rom: '128 GB',
            microUSB: 'Type-C',
            battery: '28.93 Wh'
        },
        stock: 100
    },
    {
        masp: 'App13',
        name: 'iPad Pro 11-inch M4',
        company: 'iPad',
        img: 'img/products/ipad-pro-m5.webp',
        price: 28990000,
        star: 5,
        rateCount: 3,
        promo: {
            name: 'moiramat',
            value: ''
        },
        detail: {
            screen: 'Ultra Retina XDR Tandem OLED 11-inch',
            os: 'iPadOS 17',
            camara: '12 MP và LiDaR',
            camaraFront: '12 MP',
            cpu: 'Apple M4 9 nhân',
            ram: '8 GB',
            rom: '256 GB',
            microUSB: 'Type-C',
            battery: '31.29 Wh'
        },
        stock: 100
    },
    {
        masp: 'App14',
        name: 'iPad mini 6 Wifi',
        company: 'iPad',
        img: 'img/products/ipad_mini.webp',
        price: 12990000,
        star: 4,
        rateCount: 15,
        promo: {
            name: 'giamgia',
            value: '800.000'
        },
        detail: {
            screen: 'Liquid Retina 8.3-inch',
            os: 'iPadOS 15',
            camara: '12 MP',
            camaraFront: '12 MP',
            cpu: 'Apple A15 Bionic',
            ram: '4 GB',
            rom: '64 GB',
            microUSB: 'Type-C',
            battery: '19.3 Wh'
        },
        stock: 100
    },
    {
        masp: 'App15',
        name: 'iPhone 16',
        company: 'iPhone',
        img: 'img/products/iphone_17.webp',
        price: 22990000,
        star: 5,
        rateCount: 45,
        promo: {
            name: 'tragop',
            value: '0'
        },
        detail: {
            screen: 'Super Retina XDR OLED 6.1-inch',
            os: 'iOS 18',
            camara: '48 MP và 12 MP',
            camaraFront: '12 MP',
            cpu: 'Apple A18',
            ram: '8 GB',
            rom: '128 GB',
            microUSB: 'Type-C',
            battery: '3561 mAh'
        },
        stock: 100
    },
    {
        masp: 'App16',
        name: 'iPhone 16 Pro',
        company: 'iPhone',
        img: 'img/products/iphone-17-pro.webp',
        price: 28990000,
        star: 5,
        rateCount: 22,
        promo: {
            name: 'giareonline',
            value: '27.990.000'
        },
        detail: {
            screen: 'Super Retina XDR OLED 6.3-inch',
            os: 'iOS 18',
            camara: '48 MP, 48 MP và 12 MP',
            camaraFront: '12 MP',
            cpu: 'Apple A18 Pro',
            ram: '8 GB',
            rom: '128 GB',
            microUSB: 'Type-C',
            battery: '3582 mAh'
        },
        stock: 100
    },
    {
        masp: 'App17',
        name: 'iPhone 16 Pro Max',
        company: 'iPhone',
        img: 'img/products/iphone-17-pro-max.webp',
        price: 34990000,
        star: 5,
        rateCount: 89,
        promo: {
            name: 'moiramat',
            value: ''
        },
        detail: {
            screen: 'Super Retina XDR OLED 6.9-inch',
            os: 'iOS 18',
            camara: '48 MP, 48 MP và 12 MP',
            camaraFront: '12 MP',
            cpu: 'Apple A18 Pro',
            ram: '8 GB',
            rom: '256 GB',
            microUSB: 'Type-C',
            battery: '4685 mAh'
        },
        stock: 100
    },
    {
        masp: 'App18',
        name: 'MacBook Air 13-inch M3',
        company: 'Mac',
        img: 'img/products/mac-M5.webp',
        price: 27990000,
        star: 5,
        rateCount: 31,
        promo: {
            name: 'giamgia',
            value: '2.000.000'
        },
        detail: {
            screen: 'Liquid Retina 13.6-inch',
            os: 'macOS Sonoma',
            camara: 'FaceTime HD 1080p',
            camaraFront: 'Không',
            cpu: 'Apple M3 8 nhân',
            ram: '8 GB',
            rom: '256 GB SSD',
            microUSB: 'MagSafe 3',
            battery: '52.6 Wh'
        },
        stock: 100
    },
    {
        masp: 'App19',
        name: 'MacBook Air 13-inch M2',
        company: 'Mac',
        img: 'img/products/mac_air_neo.webp',
        price: 24990000,
        star: 5,
        rateCount: 50,
        promo: {
            name: 'tragop',
            value: '0'
        },
        detail: {
            screen: 'Liquid Retina 13.6-inch',
            os: 'macOS Monterey',
            camara: 'FaceTime HD 1080p',
            camaraFront: 'Không',
            cpu: 'Apple M2 8 nhân',
            ram: '8 GB',
            rom: '256 GB SSD',
            microUSB: 'MagSafe 3',
            battery: '52.6 Wh'
        },
        stock: 100
    },
    {
        masp: 'App20',
        name: 'MacBook Pro 14-inch M3',
        company: 'Mac',
        img: 'img/products/mac_pro_M5.webp',
        price: 39990000,
        star: 5,
        rateCount: 11,
        promo: {
            name: 'moiramat',
            value: ''
        },
        detail: {
            screen: 'Liquid Retina XDR 14.2-inch',
            os: 'macOS Sonoma',
            camara: 'FaceTime HD 1080p',
            camaraFront: 'Không',
            cpu: 'Apple M3 8 nhân CPU',
            ram: '8 GB',
            rom: '512 GB SSD',
            microUSB: 'MagSafe 3',
            battery: '70 Wh'
        },
        stock: 100
    }
];

async function seed() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            process.exit(1);
        }
        await mongoose.connect(uri);
        const dsMaspApple = dsApple.map(sanPham => sanPham.masp);
        await Product.deleteMany({ masp: { $nin: dsMaspApple } });
        for (const sanPham of dsApple) {
            const { stock, ...duLieuSanPham } = sanPham;
            await Product.findOneAndUpdate(
                { masp: sanPham.masp },
                {
                    $set: duLieuSanPham,
                    $setOnInsert: { stock }
                },
                {
                    upsert: true,
                    runValidators: true
                }
            );
        }
        await User.findOneAndUpdate(
            { username: 'admin' },
            {
                username: 'admin',
                pass: maHoaMatKhau('adadad'),
                ho: 'Store',
                ten: 'Admin',
                email: 'admin@smartphonestore.com',
                role: 'admin',
                off: false
            },
            {
                upsert: true,
                runValidators: true
            }
        );
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
}

seed();
