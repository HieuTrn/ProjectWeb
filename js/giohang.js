var currentuser;
var dsCartItems = [];

window.onload = () => taiSanPhamVaChay(async () => {
    await khoiTao();

    autocomplete(document.getElementById('search-box'), list_products);

    var tags = ["Mac", "iPad", "iPhone", "Watch", "Vision", "AirPods"];
    for (var t of tags) addTags(t, "index.html?search=" + t)

    currentuser = getCurrentUser();
    if (currentuser) {
        await taiGioHangTuApi();
    }
    addProductToTable();
});

async function taiGioHangTuApi() {
    try {
        const phanHoi = await fetch('http://localhost:3000/api/cart', {
            credentials: 'include'
        });
        const ketQua = await phanHoi.json();
        if (ketQua.success && ketQua.data) {
            dsCartItems = ketQua.data;
        } else {
            dsCartItems = [];
        }
    } catch (loi) {
        console.error(loi);
        dsCartItems = [];
    }
}

function addProductToTable() {
    var table = document.getElementsByClassName('listSanPham')[0];

    var s = `
        <tbody>
            <tr>
                <th>STT</th>
                <th>Sản phẩm</th>
                <th>Giá</th>
                <th>Số lượng</th>
                <th>Thành tiền</th>
                <th>Thời gian</th>
                <th>Xóa</th>
            </tr>`;

    if (!currentuser) {
        s += `
            <tr>
                <td colspan="7"> 
                    <h1 style="color:red; background-color:white; font-weight:bold; text-align:center; padding: 15px 0;">
                        Bạn chưa đăng nhập !!
                    </h1> 
                </td>
            </tr>
        `;
        table.innerHTML = s;
        return;
    } else if (dsCartItems.length == 0) {
        s += `
            <tr>
                <td colspan="7"> 
                    <h1 style="color:green; background-color:white; font-weight:bold; text-align:center; padding: 15px 0;">
                        Giỏ hàng trống !!
                    </h1> 
                </td>
            </tr>
        `;
        table.innerHTML = s;
        return;
    }

    var totalPrice = 0;
    for (var i = 0; i < dsCartItems.length; i++) {
        var masp = dsCartItems[i].masp;
        var soluongSp = dsCartItems[i].soluong;
        var p = dsCartItems[i].sanPham;
        if (!p) continue;

        var price = (p.promo.name == 'giareonline' ? p.promo.value : numToString(p.price));
        var thoigian = new Date(dsCartItems[i].date).toLocaleString();
        var thanhtien = (p.promo.name == 'giareonline' ? stringToNum(p.promo.value) : p.price) * soluongSp;

        s += `
            <tr>
                <td>` + (i + 1) + `</td>
                <td class="noPadding imgHide">
                    <a target="_blank" href="chitietsanpham.html?` + p.name.split(' ').join('-') + `" title="Xem chi tiết">
                        ` + p.name + `
                        <img src="` + p.img + `">
                    </a>
                </td>
                <td class="alignRight">` + price + ` ₫</td>
                <td class="soluong" >
                    <button onclick="giamSoLuong('` + masp + `')"><i class="fa fa-minus"></i></button>
                    <input size="1" onchange="capNhatSoLuongFromInput(this, '` + masp + `')" value=` + soluongSp + `>
                    <button onclick="tangSoLuong('` + masp + `')"><i class="fa fa-plus"></i></button>
                </td>
                <td class="alignRight">` + numToString(thanhtien) + ` ₫</td>
                <td style="text-align: center" >` + thoigian + `</td>
                <td class="noPadding"> <i class="fa fa-trash" onclick="xoaSanPhamTrongGioHang('` + masp + `')"></i> </td>
            </tr>
        `;
        totalPrice += thanhtien;
    }

    s += `
            <tr style="font-weight:bold; text-align:center">
                <td colspan="4">TỔNG TIỀN: </td>
                <td class="alignRight">` + numToString(totalPrice) + ` ₫</td>
                <td class="thanhtoan" onclick="thanhToan()"> Thanh Toán </td>
                <td class="xoaHet" onclick="xoaHet()"> Xóa hết </td>
            </tr>
        </tbody>
    `;

    table.innerHTML = s;
}

async function xoaSanPhamTrongGioHang(masp) {
    if (window.confirm('Xác nhận hủy mua')) {
        try {
            const phanHoi = await fetch('http://localhost:3000/api/cart/remove?masp=' + masp, {
                method: 'DELETE',
                credentials: 'include'
            });
            const ketQua = await phanHoi.json();
            if (ketQua.success) {
                await taiGioHangTuApi();
                await capNhatMoiThu();
            } else {
                alert(ketQua.error.message || 'Lỗi khi xóa sản phẩm');
            }
        } catch (loi) {
            console.error(loi);
        }
    }
}

async function thanhToan() {
    var c_user = getCurrentUser();
    if(c_user.off) {
        alert('Tài khoản của bạn hiện đang bị khóa nên không thể mua hàng!');
        addAlertBox('Tài khoản của bạn đã bị khóa bởi Admin.', '#aa0000', '#fff', 10000);
        return;
    }
    
    if (!dsCartItems.length) {
        addAlertBox('Không có mặt hàng nào cần thanh toán !!', '#ffb400', '#fff', 2000);
        return;
    }
    if (window.confirm('Thanh toán giỏ hàng ?')) {
        var idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now().toString() + Math.random().toString(36).substring(2);

        try {
            const phanHoi = await fetch('http://localhost:3000/api/orders/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ idempotencyKey })
            });
            const ketQua = await phanHoi.json();
            if (ketQua.success) {
                await taiGioHangTuApi();
                await capNhatMoiThu();
                addAlertBox('Các sản phẩm đã được gửi vào đơn hàng và chờ xử lý.', '#17c671', '#fff', 4000);
            } else {
                alert(ketQua.error.message || 'Lỗi khi thanh toán đơn hàng');
            }
        } catch (loi) {
            console.error(loi);
            alert('Không thể kết nối tới server!');
        }
    }
}

async function xoaHet() {
    if (dsCartItems.length) {
        if (window.confirm('Bạn có chắc chắn muốn xóa hết sản phẩm trong giỏ !!')) {
            try {
                const phanHoi = await fetch('http://localhost:3000/api/cart/clear', {
                    method: 'DELETE',
                    credentials: 'include'
                });
                const ketQua = await phanHoi.json();
                if (ketQua.success) {
                    await taiGioHangTuApi();
                    await capNhatMoiThu();
                } else {
                    alert(ketQua.error.message || 'Lỗi khi làm sạch giỏ hàng');
                }
            } catch (loi) {
                console.error(loi);
            }
        }
    }
}

async function capNhatSoLuongFromInput(inp, masp) {
    var soLuongMoi = Number(inp.value);
    if (!soLuongMoi || soLuongMoi <= 0) soLuongMoi = 1;

    try {
        const phanHoi = await fetch('http://localhost:3000/api/cart/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ masp, soluong: soLuongMoi })
        });
        const ketQua = await phanHoi.json();
        if (ketQua.success) {
            await taiGioHangTuApi();
            await capNhatMoiThu();
        } else {
            alert(ketQua.error.message || 'Lỗi khi cập nhật số lượng');
        }
    } catch (loi) {
        console.error(loi);
    }
}

async function tangSoLuong(masp) {
    const item = dsCartItems.find(i => i.masp === masp);
    if (!item) return;
    const soLuongMoi = item.soluong + 1;

    try {
        const phanHoi = await fetch('http://localhost:3000/api/cart/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ masp, soluong: soLuongMoi })
        });
        const ketQua = await phanHoi.json();
        if (ketQua.success) {
            await taiGioHangTuApi();
            await capNhatMoiThu();
        } else {
            alert(ketQua.error.message || 'Lỗi khi cập nhật số lượng');
        }
    } catch (loi) {
        console.error(loi);
    }
}

async function giamSoLuong(masp) {
    const item = dsCartItems.find(i => i.masp === masp);
    if (!item) return;
    if (item.soluong <= 1) return;
    const soLuongMoi = item.soluong - 1;

    try {
        const phanHoi = await fetch('http://localhost:3000/api/cart/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ masp, soluong: soLuongMoi })
        });
        const ketQua = await phanHoi.json();
        if (ketQua.success) {
            await taiGioHangTuApi();
            await capNhatMoiThu();
        } else {
            alert(ketQua.error.message || 'Lỗi khi cập nhật số lượng');
        }
    } catch (loi) {
        console.error(loi);
    }
}

async function capNhatMoiThu() {
    animateCartNumber();
    addProductToTable();
    await capNhat_ThongTin_CurrentUser();
}
