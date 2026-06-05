var currentUser;
var tongTienTatCaDonHang = 0;
var tongSanPhamTatCaDonHang = 0;

window.onload = () => taiSanPhamVaChay(async () => {
    await khoiTao();

    autocomplete(document.getElementById('search-box'), list_products);

    var tags = ["Mac", "iPad", "iPhone", "Watch", "Vision", "AirPods"];
    for (var t of tags) addTags(t, "index.html?search=" + t);

    currentUser = getCurrentUser();

    if (currentUser) {
        await taiVaHienThiDonHang(currentUser);
        addInfoUser(currentUser);
    
    } else {
        var warning = `<h2 style="color: red; font-weight:bold; text-align:center; font-size: 2em; padding: 50px;">
                            Bạn chưa đăng nhập !!
                        </h2>`;
        document.getElementsByClassName('infoUser')[0].innerHTML = warning;
    }
});

async function taiVaHienThiDonHang(user) {
    try {
        const phanHoi = await fetch('http://localhost:3000/api/orders', {
            credentials: 'include'
        });
        const ketQua = await phanHoi.json();
        if (ketQua.success && ketQua.data) {
            addTatCaDonHang(user, ketQua.data);
        } else {
            addTatCaDonHang(user, []);
        }
    } catch (loi) {
        console.error(loi);
        addTatCaDonHang(user, []);
    }
}

function addInfoUser(user) {
    if (!user) return;
    document.getElementsByClassName('infoUser')[0].innerHTML = `
    <hr>
    <table>
        <tr>
            <th colspan="3">THÔNG TIN KHÁCH HÀNG</th>
        </tr>
        <tr>
            <td>Tài khoản: </td>
            <td> <input type="text" value="` + user.username + `" readonly> </td>
            <td></td>
        </tr>
        <tr>
            <td>Mật khẩu: </td>
            <td style="text-align: center;"> 
                <i class="fa fa-pencil" id="butDoiMatKhau" onclick="openChangePass()"> Đổi mật khẩu</i> 
            </td>
            <td></td>
        </tr>
        <tr>
            <td colspan="3" id="khungDoiMatKhau">
                <table>
                    <tr>
                        <td> <div>Mật khẩu cũ:</div> </td>
                        <td> <div><input type="password"></div> </td>
                    </tr>
                    <tr>
                        <td> <div>Mật khẩu mới:</div> </td>
                        <td> <div><input type="password"></div> </td>
                    </tr>
                    <tr>
                        <td> <div>Xác nhận mật khẩu:</div> </td>
                        <td> <div><input type="password"></div> </td>
                    </tr>
                    <tr>
                        <td></td>
                        <td> 
                            <div><button onclick="changePass()">Đồng ý</button></div> 
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td>Họ: </td>
            <td> <input type="text" value="` + user.ho + `" readonly> </td>
            <td> <i class="fa fa-pencil" onclick="changeInfo(this, 'ho')"></i> </td>
        </tr>
        <tr>
            <td>Tên: </td>
            <td> <input type="text" value="` + user.ten + `" readonly> </td>
            <td> <i class="fa fa-pencil" onclick="changeInfo(this, 'ten')"></i> </td>
        </tr>
        <tr>
            <td>Email: </td>
            <td> <input type="text" value="` + user.email + `" readonly> </td>
            <td> <i class="fa fa-pencil" onclick="changeInfo(this, 'email')"></i> </td>
        </tr>
        <tr>
            <td colspan="3" style="padding:5px; border-top: 2px solid #ccc;"></td>
        </tr>
        <tr>
            <td>Tổng tiền đã mua: </td>
            <td> <input type="text" value="` + numToString(tongTienTatCaDonHang) + `₫" readonly> </td>
            <td></td>
        </tr>
        <tr>
            <td>Số lượng sản phẩm đã mua: </td>
            <td> <input type="text" value="` + tongSanPhamTatCaDonHang + `" readonly> </td>
            <td></td>
        </tr>
    </table>`;
}

function openChangePass() {
    var khungChangePass = document.getElementById('khungDoiMatKhau');
    var actived = khungChangePass.classList.contains('active');
    if (actived) khungChangePass.classList.remove('active');
    else khungChangePass.classList.add('active');
}

async function changePass() {
    var khungChangePass = document.getElementById('khungDoiMatKhau');
    var inps = khungChangePass.getElementsByTagName('input');
    var passCu = inps[0].value;
    var passMoi = inps[1].value;
    var confirmPass = inps[2].value;

    if (passCu === '') {
        alert('Chưa nhập mật khẩu cũ!');
        inps[0].focus();
        return;
    }
    if (passMoi === '') {
        alert('Chưa nhập mật khẩu mới!');
        inps[1].focus();
        return;
    }
    if (passMoi !== confirmPass) {
        alert('Mật khẩu xác nhận không khớp');
        inps[2].focus();
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/users/password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ passCu, passMoi })
        });
        const result = await response.json();
        if (result.success) {
            addAlertBox('Thay đổi mật khẩu thành công.', '#5f5', '#000', 4000);
            openChangePass();
            inps[0].value = '';
            inps[1].value = '';
            inps[2].value = '';
        } else {
            alert(result.error.message || 'Lỗi khi thay đổi mật khẩu');
        }
    } catch (loi) {
        console.error(loi);
        alert('Không thể kết nối tới server!');
    }
}

async function changeInfo(iTag, info) {
    var inp = iTag.parentElement.previousElementSibling.getElementsByTagName('input')[0];

    if (!inp.readOnly && inp.value != '') {
        if (info === 'username') {
            alert('Không thể thay đổi tên đăng nhập!');
            inp.value = currentUser.username;
            inp.readOnly = true;
            iTag.innerHTML = '';
            return;
        }

        const body = {
            ho: info === 'ho' ? inp.value : currentUser.ho,
            ten: info === 'ten' ? inp.value : currentUser.ten,
            email: info === 'email' ? inp.value : currentUser.email
        };

        try {
            const response = await fetch('http://localhost:3000/api/users/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            });
            const result = await response.json();
            if (result.success) {
                currentUser = result.data;
                inp.value = currentUser[info];
                addAlertBox('Cập nhật thông tin thành công.', '#5f5', '#000', 3000);
                iTag.innerHTML = '';
                await capNhat_ThongTin_CurrentUser();
            } else {
                alert(result.error.message || 'Lỗi khi cập nhật thông tin');
                inp.value = currentUser[info];
                iTag.innerHTML = '';
            }
        } catch (loi) {
            console.error(loi);
            alert('Không thể kết nối tới server!');
            inp.value = currentUser[info];
            iTag.innerHTML = '';
        }
    } else {
        iTag.innerHTML = 'Đồng ý';
        inp.focus();
        var v = inp.value;
        inp.value = '';
        inp.value = v;
    }

    inp.readOnly = !inp.readOnly;
}


function addTatCaDonHang(user, dsDonHang) {
    if (!user) {
        document.getElementsByClassName('listDonHang')[0].innerHTML = `
            <h3 style="width=100%; padding: 50px; color: red; font-size: 2em; text-align: center"> 
                Bạn chưa đăng nhập !!
            </h3>`;
        return;
    }
    if (!dsDonHang || !dsDonHang.length) {
        document.getElementsByClassName('listDonHang')[0].innerHTML = `
            <h3 style="width=100%; padding: 50px; color: green; font-size: 2em; text-align: center"> 
                Xin chào ` + currentUser.username + `. Bạn chưa có đơn hàng nào.
            </h3>`;
        return;
    }
    for (var dh of dsDonHang) {
        addDonHang(dh);
    }
}

function addDonHang(dh) {
    var div = document.getElementsByClassName('listDonHang')[0];

    var s = `
            <table class="listSanPham">
                <tr> 
                    <th colspan="6">
                        <h3 style="text-align:center;"> Đơn hàng ngày: ` + new Date(dh.ngayMua).toLocaleString() + `</h3> 
                    </th>
                </tr>
                <tr>
                    <th>STT</th>
                    <th>Sản phẩm</th>
                    <th>Giá</th>
                    <th>Số lượng</th>
                    <th>Thành tiền</th>
                </tr>`;

    var totalPrice = 0;
    for (var i = 0; i < dh.items.length; i++) {
        var item = dh.items[i];

        s += `
                <tr>
                    <td>` + (i + 1) + `</td>
                    <td class="noPadding imgHide">
                        <a target="_blank" href="chitietsanpham.html?` + item.name.split(' ').join('-') + `" title="Xem chi tiết">
                            ` + item.name + `
                            <img src="` + item.img + `">
                        </a>
                    </td>
                    <td class="alignRight">` + numToString(item.gia) + ` ₫</td>
                    <td class="soluong" >
                         ` + item.soluong + `
                    </td>
                    <td class="alignRight">` + numToString(item.thanhTien) + ` ₫</td>
                </tr>
            `;
        totalPrice += item.thanhTien;
        tongSanPhamTatCaDonHang += item.soluong;
    }
    tongTienTatCaDonHang += totalPrice;

    s += `
                <tr style="font-weight:bold; text-align:center; height: 4em;">
                    <td colspan="3">TỔNG TIỀN: </td>
                    <td class="alignRight">` + numToString(totalPrice) + ` ₫</td>
                    <td > ` + dh.tinhTrang + ` </td>
                </tr>
            </table>
            <hr>
        `;
    div.innerHTML += s;
}
