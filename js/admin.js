var TONGTIEN = 0;

window.onload = () => taiSanPhamVaChay(() => {
    addEventChangeTab();

    const user = getCurrentUser();
    if (user && user.role === 'admin') {
        addTableProducts();
        addTableDonHang();
        addTableKhachHang();
        addThongKe();

        openTab('Trang Chủ')
    } else {
        document.body.innerHTML = `<h1 style="color:red; width:100%; text-align:center; margin: 50px;"> Truy cập bị từ chối.. </h1>`;
    }
});

function logOutAdmin() {
    logOut();
}

function getListRandomColor(length) {
    let result = [];
    for(let i = length; i--;) {
        result.push(getRandomColor());
    }
    return result;
}

function addChart(id, chartOption) {
    var ctx = document.getElementById(id).getContext('2d');
    var chart = new Chart(ctx, chartOption);
}

function createChartConfig(
    title = 'Title',
    charType = 'bar', 
    labels = ['nothing'], 
    data = [2], 
    colors = ['red'], 
) {
    return {
        type: charType,
        data: {
            labels: labels,
            datasets: [{
                label: title,
                data: data,
                backgroundColor: colors,
                borderColor: colors,
                // borderWidth: 2
            }]
        },
        options: {
            title: {
                fontColor: '#fff',
                fontSize: 25,
                display: true,
                text: title
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    };
}

async function addThongKe() {
    var tc1 = document.getElementById('myChart1');
    var tc2 = document.getElementById('myChart2');
    if (!tc1 || !tc2) return;

    try {
        const response = await fetch('http://localhost:3000/api/admin/stats', {
            credentials: 'include'
        });
        const result = await response.json();
        if (!result.success) {
            console.error(result.error);
            return;
        }
        var thongKeHang = result.data;
        let colors = getListRandomColor(Object.keys(thongKeHang).length);

        addChart('myChart1', createChartConfig(
            'Số lượng bán ra',
            'bar', 
            Object.keys(thongKeHang), 
            Object.values(thongKeHang).map(_ => _.soLuongBanRa),
            colors,
        ));

        addChart('myChart2', createChartConfig(
            'Doanh thu',
            'doughnut', 
            Object.keys(thongKeHang), 
            Object.values(thongKeHang).map(_ => _.doanhThu),
            colors,
        ));
    } catch (loi) {
        console.error(loi);
    }
}

// ======================= Các Tab =========================
function addEventChangeTab() {
    var sidebar = document.getElementsByClassName('sidebar')[0];
    var list_a = sidebar.getElementsByTagName('a');
    for(var a of list_a) {
        if(!a.onclick) {
            a.addEventListener('click', function() {
                turnOff_Active();
                this.classList.add('active');
                var tab = this.childNodes[1].data.trim()
                openTab(tab);
            })
        }
    }
}

function turnOff_Active() {
    var sidebar = document.getElementsByClassName('sidebar')[0];
    var list_a = sidebar.getElementsByTagName('a');
    for(var a of list_a) {
        a.classList.remove('active');
    }
}

function openTab(nameTab) {
    // ẩn hết
    var main = document.getElementsByClassName('main')[0].children;
    for(var e of main) {
        e.style.display = 'none';
    }

    // mở tab
    switch(nameTab) {
        case 'Trang Chủ': document.getElementsByClassName('home')[0].style.display = 'block'; break;
        case 'Sản Phẩm': document.getElementsByClassName('sanpham')[0].style.display = 'block'; break;
        case 'Đơn Hàng': document.getElementsByClassName('donhang')[0].style.display = 'block'; break;
        case 'Khách Hàng': document.getElementsByClassName('khachhang')[0].style.display = 'block'; break;
    }
}

// ========================== Sản Phẩm ========================
// Vẽ bảng danh sách sản phẩm
function addTableProducts() {
    var tc = document.getElementsByClassName('sanpham')[0].getElementsByClassName('table-content')[0];
    var s = `<table class="table-outline hideImg">`;

    for (var i = 0; i < list_products.length; i++) {
        var p = list_products[i];
        s += `<tr>
            <td style="width: 5%">` + (i+1) + `</td>
            <td style="width: 10%">` + p.masp + `</td>
            <td style="width: 40%">
                <a title="Xem chi tiết" target="_blank" href="chitietsanpham.html?` + p.name.split(' ').join('-') + `">` + p.name + `</a>
                <img src="` + p.img + `"></img>
            </td>
            <td style="width: 15%">` + p.price + `</td>
            <td style="width: 15%">` + promoToStringValue(p.promo) + `</td>
            <td style="width: 15%">
                <div class="tooltip">
                    <i class="fa fa-wrench" onclick="addKhungSuaSanPham('` + p.masp + `')"></i>
                    <span class="tooltiptext">Sửa</span>
                </div>
                <div class="tooltip">
                    <i class="fa fa-trash" onclick="xoaSanPham('` + p.masp + `', '`+p.name+`')"></i>
                    <span class="tooltiptext">Xóa</span>
                </div>
            </td>
        </tr>`;
    }

    s += `</table>`;

    tc.innerHTML = s;
}

// Tìm kiếm
function timKiemSanPham(inp) {
    var kieuTim = document.getElementsByName('kieuTimSanPham')[0].value;
    var text = inp.value;

    // Lọc
    var vitriKieuTim = {'ma':1, 'ten':2}; // mảng lưu vị trí cột

    var listTr_table = document.getElementsByClassName('sanpham')[0].getElementsByClassName('table-content')[0].getElementsByTagName('tr');
    for (var tr of listTr_table) {
        var td = tr.getElementsByTagName('td')[vitriKieuTim[kieuTim]].innerHTML.toLowerCase();

        if (td.indexOf(text.toLowerCase()) < 0) {
            tr.style.display = 'none';
        } else {
            tr.style.display = '';
        }
    }
}

// Thêm
let previewSrc; // biến toàn cục lưu file ảnh đang thêm
function layThongTinSanPhamTuTable(id) {
    var khung = document.getElementById(id);
    var tr = khung.getElementsByTagName('tr');

    var masp = tr[1].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var name = tr[2].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var company = tr[3].getElementsByTagName('td')[1].getElementsByTagName('select')[0].value;
    var img = tr[4].getElementsByTagName('td')[1].getElementsByTagName('img')[0].src;
    var price = tr[5].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var star = tr[6].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var rateCount = tr[7].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var promoName = tr[8].getElementsByTagName('td')[1].getElementsByTagName('select')[0].value;
    var promoValue = tr[9].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;

    var screen = tr[11].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var os = tr[12].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var camara = tr[13].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var camaraFront = tr[14].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var cpu = tr[15].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var ram = tr[16].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var rom = tr[17].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var microUSB = tr[18].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;
    var battery = tr[19].getElementsByTagName('td')[1].getElementsByTagName('input')[0].value;

    if(isNaN(price)) {
        alert('Giá phải là số nguyên');
        return false;
    }

    if(isNaN(star)) {
        alert('Số sao phải là số nguyên');
        return false;
    }

    if(isNaN(rateCount)) {
        alert('Số đánh giá phải là số nguyên');
        return false;
    }

    try {
        return {
            "name": name,
            "company": company,
            "img": previewSrc,
            "price": numToString(Number.parseInt(price, 10)),
            "star": Number.parseInt(star, 10),
            "rateCount": Number.parseInt(rateCount, 10),
            "promo": {
                "name": promoName,
                "value": promoValue
            },
            "detail": {
                "screen": screen,
                "os": os,
                "camara": camara,
                "camaraFront": camaraFront,
                "cpu": cpu,
                "ram": ram,
                "rom": rom,
                "microUSB": microUSB,
                "battery": battery
            },
            "masp" : masp
        }
    } catch(e) {
        alert('Lỗi: ' + e.toString());
        return false;
    }
}
async function themSanPham() {
    var newSp = layThongTinSanPhamTuTable('khungThemSanPham');
    if(!newSp) return;

    try {
        const phanHoi = await fetch('http://localhost:3000/api/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(newSp)
        });
        const ketQua = await phanHoi.json();
        if (ketQua.success) {
            alert('Thêm sản phẩm "' + newSp.name + '" thành công.');
            document.getElementById('khungThemSanPham').style.transform = 'scale(0)';
            await taiDanhSachSanPhamTuApi();
            addTableProducts();
        } else {
            alert(ketQua.error.message || 'Lỗi khi thêm sản phẩm');
        }
    } catch (loi) {
        console.error('Lỗi khi thêm sản phẩm:', loi);
        alert('Không thể kết nối tới server!');
    }
}

async function xoaSanPham(masp, tensp) {
    if (window.confirm('Bạn có chắc muốn xóa ' + tensp)) {
        try {
            const phanHoi = await fetch('http://localhost:3000/api/admin/products?masp=' + masp, {
                method: 'DELETE',
                credentials: 'include'
            });
            const ketQua = await phanHoi.json();
            if (ketQua.success) {
                alert('Xóa sản phẩm thành công.');
                await taiDanhSachSanPhamTuApi();
                addTableProducts();
            } else {
                alert(ketQua.error.message || 'Lỗi khi xóa sản phẩm');
            }
        } catch (loi) {
            console.error('Lỗi khi xóa sản phẩm:', loi);
            alert('Không thể kết nối tới server!');
        }
    }
}

async function suaSanPham(masp) {
    var sp = layThongTinSanPhamTuTable('khungSuaSanPham');
    if(!sp) return;

    try {
        const phanHoi = await fetch('http://localhost:3000/api/admin/products?masp=' + masp, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(sp)
        });
        const ketQua = await phanHoi.json();
        if (ketQua.success) {
            alert('Sửa ' + sp.name + ' thành công');
            document.getElementById('khungSuaSanPham').style.transform = 'scale(0)';
            await taiDanhSachSanPhamTuApi();
            addTableProducts();
        } else {
            alert(ketQua.error.message || 'Lỗi khi sửa sản phẩm');
        }
    } catch (loi) {
        console.error('Lỗi khi sửa sản phẩm:', loi);
        alert('Không thể kết nối tới server!');
    }
}

function addKhungSuaSanPham(masp) {
    var sp;
    for(var p of list_products) {
        if(p.masp == masp) {
            sp = p;
        }
    }

    var s = `<span class="close" onclick="this.parentElement.style.transform = 'scale(0)';">&times;</span>
    <table class="overlayTable table-outline table-content table-header">
        <tr>
            <th colspan="2">`+sp.name+`</th>
        </tr>
        <tr>
            <td>Mã sản phẩm:</td>
            <td><input type="text" value="`+sp.masp+`"></td>
        </tr>
        <tr>
            <td>Tên sẩn phẩm:</td>
            <td><input type="text" value="`+sp.name+`"></td>
        </tr>
        <tr>
            <td>Hãng:</td>
            <td>
                <select>`
                    
    var company = ["Mac", "iPad", "iPhone", "Watch", "Vision", "Airpods"];
    for(var c of company) {
        if(sp.company == c)
            s += (`<option value="`+c+`" selected>`+c+`</option>`);
        else s += (`<option value="`+c+`">`+c+`</option>`);
    }

    s += `
                </select>
            </td>
        </tr>
        <tr>
            <td>Hình:</td>
            <td>
                <img class="hinhDaiDien" id="anhDaiDienSanPhamSua" src="`+sp.img+`">
                <input type="file" accept="image/*" onchange="capNhatAnhSanPham(this.files, 'anhDaiDienSanPhamSua')">
            </td>
        </tr>
        <tr>
            <td>Giá tiền (số nguyên):</td>
            <td><input type="text" value="`+stringToNum(sp.price)+`"></td>
        </tr>
        <tr>
            <td>Số sao (số nguyên 0->5):</td>
            <td><input type="text" value="`+sp.star+`"></td>
        </tr>
        <tr>
            <td>Đánh giá (số nguyên):</td>
            <td><input type="text" value="`+sp.rateCount+`"></td>
        </tr>
        <tr>
            <td>Khuyến mãi:</td>
            <td>
                <select>
                    <option value="">Không</option>
                    <option value="tragop" `+(sp.promo.name == 'tragop'?'selected':'')+`>Trả góp</option>
                    <option value="giamgia" `+(sp.promo.name == 'giamgia'?'selected':'')+`>Giảm giá</option>
                    <option value="giareonline" `+(sp.promo.name == 'giareonline'?'selected':'')+`>Giá rẻ online</option>
                    <option value="moiramat" `+(sp.promo.name == 'moiramat'?'selected':'')+`>Mới ra mắt</option>
                </select>
            </td>
        </tr>
        <tr>
            <td>Giá trị khuyến mãi:</td>
            <td><input type="text" value="`+sp.promo.value+`"></td>
        </tr>
        <tr>
            <th colspan="2">Thông số kĩ thuật</th>
        </tr>
        <tr>
            <td>Màn hình:</td>
            <td><input type="text" value="`+sp.detail.screen+`"></td>
        </tr>
        <tr>
            <td>Hệ điều hành:</td>
            <td><input type="text" value="`+sp.detail.os+`"></td>
        </tr>
        <tr>
            <td>Camara sau:</td>
            <td><input type="text" value="`+sp.detail.camara+`"></td>
        </tr>
        <tr>
            <td>Camara trước:</td>
            <td><input type="text" value="`+sp.detail.camaraFront+`"></td>
        </tr>
        <tr>
            <td>CPU:</td>
            <td><input type="text" value="`+sp.detail.cpu+`"></td>
        </tr>
        <tr>
            <td>RAM:</td>
            <td><input type="text" value="`+sp.detail.ram+`"></td>
        </tr>
        <tr>
            <td>Bộ nhớ trong:</td>
            <td><input type="text" value="`+sp.detail.rom+`"></td>
        </tr>
        <tr>
            <td>Thẻ nhớ:</td>
            <td><input type="text" value="`+sp.detail.microUSB+`"></td>
        </tr>
        <tr>
            <td>Dung lượng Pin:</td>
            <td><input type="text" value="`+sp.detail.battery+`"></td>
        </tr>
        <tr>
            <td colspan="2"  class="table-footer"> <button onclick="suaSanPham('`+sp.masp+`')">SỬA</button> </td>
        </tr>
    </table>`
    var khung = document.getElementById('khungSuaSanPham');
    khung.innerHTML = s;
    khung.style.transform = 'scale(1)';
}

// Cập nhật ảnh sản phẩm
function capNhatAnhSanPham(files, id) {
    // var url = '';
    // if(files.length) url = window.URL.createObjectURL(files[0]);
    
    // document.getElementById(id).src = url;

    const reader = new FileReader();
    reader.addEventListener("load", function () {
        // convert image file to base64 string
        previewSrc = reader.result;
        document.getElementById(id).src = previewSrc;
    }, false);

    if (files[0]) {
        reader.readAsDataURL(files[0]);
    }
} 

// Sắp Xếp sản phẩm
function sortProductsTable(loai) {
    var list = document.getElementsByClassName('sanpham')[0].getElementsByClassName("table-content")[0];
    var tr = list.getElementsByTagName('tr');

    quickSort(tr, 0, tr.length-1, loai, getValueOfTypeInTable_SanPham); // type cho phép lựa chọn sort theo mã hoặc tên hoặc giá ... 
    decrease = !decrease;
}

// Lấy giá trị của loại(cột) dữ liệu nào đó trong bảng
function getValueOfTypeInTable_SanPham(tr, loai) {
    var td = tr.getElementsByTagName('td');
    switch(loai) {
        case 'stt' : return Number(td[0].innerHTML);
        case 'masp' : return td[1].innerHTML.toLowerCase();
        case 'ten' : return td[2].innerHTML.toLowerCase();
        case 'gia' : return stringToNum(td[3].innerHTML);
        case 'khuyenmai' : return td[4].innerHTML.toLowerCase();
    }
    return false;
}

// ========================= Đơn Hàng ===========================
// Vẽ bảng
async function addTableDonHang() {
    var tc = document.getElementsByClassName('donhang')[0].getElementsByClassName('table-content')[0];
    var s = `<table class="table-outline hideImg">`;

    try {
        const response = await fetch('http://localhost:3000/api/admin/orders', {
            credentials: 'include'
        });
        const result = await response.json();
        if (!result.success) {
            tc.innerHTML = `<h3 style="color:red; text-align:center;">` + result.error.message + `</h3>`;
            return;
        }
        var listDH = result.data;

        TONGTIEN = 0;
        for (var i = 0; i < listDH.length; i++) {
            var d = listDH[i];
            var sps = '';
            for(var sItem of d.items) {
                sps += `<p style="text-align: right">` + sItem.name + ' [' + sItem.soluong + '] </p>';
            }

            s += `<tr>
                <td style="width: 5%">` + (i+1) + `</td>
                <td style="width: 13%">` + d._id + `</td>
                <td style="width: 7%">` + d.khachhang + `</td>
                <td style="width: 20%">` + sps + `</td>
                <td style="width: 15%">` + numToString(d.tongTien) + `</td>
                <td style="width: 10%">` + new Date(d.ngayMua).toLocaleString() + `</td>
                <td style="width: 10%">` + d.tinhTrang + `</td>
                <td style="width: 10%">
                    <div class="tooltip">
                        <i class="fa fa-check" onclick="duyet('`+d._id+`', true)"></i>
                        <span class="tooltiptext">Duyệt</span>
                    </div>
                    <div class="tooltip">
                        <i class="fa fa-remove" onclick="duyet('`+d._id+`', false)"></i>
                        <span class="tooltiptext">Hủy</span>
                    </div>
                </td>
            </tr>`;
            if (d.tinhTrang !== 'Đã hủy') {
                TONGTIEN += d.tongTien;
            }
        }

        s += `</table>`;
        tc.innerHTML = s;
    } catch (loi) {
        console.error(loi);
        tc.innerHTML = `<h3 style="color:red; text-align:center;">Không thể kết nối đến server</h3>`;
    }
}

async function duyet(maDonHang, duyetDon) {
    try {
        const response = await fetch('http://localhost:3000/api/admin/orders/status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ orderId: maDonHang, duyetDon })
        });
        const result = await response.json();
        if (result.success) {
            alert('Cập nhật trạng thái đơn hàng thành công');
            await addTableDonHang();
        } else {
            alert(result.error.message || 'Lỗi khi cập nhật đơn hàng');
        }
    } catch (loi) {
        console.error(loi);
        alert('Không thể kết nối tới server!');
    }
}

function locDonHangTheoKhoangNgay() {
    var from = document.getElementById('fromDate').valueAsDate;
    var to = document.getElementById('toDate').valueAsDate;

    var listTr_table = document.getElementsByClassName('donhang')[0].getElementsByClassName('table-content')[0].getElementsByTagName('tr');
    for (var tr of listTr_table) {
        var td = tr.getElementsByTagName('td')[5].innerHTML;
        var d = new Date(td);

        if (d >= from && d <= to) {
            tr.style.display = '';
        } else {
            tr.style.display = 'none';
        }
    }
}

function timKiemDonHang(inp) {
    var kieuTim = document.getElementsByName('kieuTimDonHang')[0].value;
    var text = inp.value;

    // Lọc
    var vitriKieuTim = {'ma':1, 'khachhang':2, 'trangThai':6};

    var listTr_table = document.getElementsByClassName('donhang')[0].getElementsByClassName('table-content')[0].getElementsByTagName('tr');
    for (var tr of listTr_table) {
        var td = tr.getElementsByTagName('td')[vitriKieuTim[kieuTim]].innerHTML.toLowerCase();

        if (td.indexOf(text.toLowerCase()) < 0) {
            tr.style.display = 'none';
        } else {
            tr.style.display = '';
        }
    }
}

// Sắp xếp
function sortDonHangTable(loai) {
    var list = document.getElementsByClassName('donhang')[0].getElementsByClassName("table-content")[0];
    var tr = list.getElementsByTagName('tr');

    quickSort(tr, 0, tr.length-1, loai, getValueOfTypeInTable_DonHang); 
    decrease = !decrease;
}

// Lấy giá trị của loại(cột) dữ liệu nào đó trong bảng
function getValueOfTypeInTable_DonHang(tr, loai) {
    var td = tr.getElementsByTagName('td');
    switch(loai) {
        case 'stt': return Number(td[0].innerHTML);
        case 'ma' : return new Date(td[1].innerHTML); // chuyển về dạng ngày để so sánh ngày
        case 'khach' : return td[2].innerHTML.toLowerCase(); // lấy tên khách
        case 'sanpham' : return td[3].children.length;    // lấy số lượng hàng trong đơn này, length ở đây là số lượng <p>
        case 'tongtien' : return stringToNum(td[4].innerHTML); // trả về dạng giá tiền
        case 'ngaygio' : return new Date(td[5].innerHTML); // chuyển về ngày
        case 'trangthai': return td[6].innerHTML.toLowerCase(); //
    }
    return false;
}

// ====================== Khách Hàng =============================
// Vẽ bảng
async function addTableKhachHang() {
    var tc = document.getElementsByClassName('khachhang')[0].getElementsByClassName('table-content')[0];
    var s = `<table class="table-outline hideImg">`;

    try {
        const response = await fetch('http://localhost:3000/api/admin/users', {
            credentials: 'include'
        });
        const result = await response.json();
        if (!result.success) {
            tc.innerHTML = `<h3 style="color:red; text-align:center;">` + result.error.message + `</h3>`;
            return;
        }
        var listUser = result.data;

        for (var i = 0; i < listUser.length; i++) {
            var u = listUser[i];
            s += `<tr>
                <td style="width: 5%">` + (i+1) + `</td>
                <td style="width: 15%">` + u.ho + ' ' + u.ten + `</td>
                <td style="width: 20%">` + u.email + `</td>
                <td style="width: 20%">` + u.username + `</td>
                <td style="width: 10%">*******</td>
                <td style="width: 10%">
                    <div class="tooltip">
                        <label class="switch">
                            <input type="checkbox" `+(u.off?'':'checked')+` onclick="voHieuHoaNguoiDung(this, '`+u.username+`')">
                            <span class="slider round"></span>
                        </label>
                        <span class="tooltiptext">`+(u.off?'Mở':'Khóa')+`</span>
                    </div>
                    <div class="tooltip">
                        <i class="fa fa-remove" onclick="xoaNguoiDung('`+u.username+`')"></i>
                        <span class="tooltiptext">Xóa</span>
                    </div>
                </td>
            </tr>`;
        }

        s += `</table>`;
        tc.innerHTML = s;
    } catch (loi) {
        console.error(loi);
        tc.innerHTML = `<h3 style="color:red; text-align:center;">Không thể kết nối đến server</h3>`;
    }
}

function timKiemNguoiDung(inp) {
    var kieuTim = document.getElementsByName('kieuTimKhachHang')[0].value;
    var text = inp.value;

    var vitriKieuTim = {'ten':1, 'email':2, 'taikhoan':3};

    var listTr_table = document.getElementsByClassName('khachhang')[0].getElementsByClassName('table-content')[0].getElementsByTagName('tr');
    for (var tr of listTr_table) {
        var td = tr.getElementsByTagName('td')[vitriKieuTim[kieuTim]].innerHTML.toLowerCase();

        if (td.indexOf(text.toLowerCase()) < 0) {
            tr.style.display = 'none';
        } else {
            tr.style.display = '';
        }
    }
}

function openThemNguoiDung() {
    window.alert('Not Available!');
}

async function voHieuHoaNguoiDung(inp, taikhoan) {
    let value = !inp.checked;
    try {
        const response = await fetch('http://localhost:3000/api/admin/users/status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username: taikhoan, off: value })
        });
        const result = await response.json();
        if (result.success) {
            alert((value ? 'Khoá' : 'Mở khoá') + ' tài khoản ' + taikhoan + ' thành công.');
            var span = inp.parentElement.nextElementSibling;
            span.innerHTML = (inp.checked?'Khóa':'Mở');
        } else {
            alert(result.error.message || 'Lỗi khi cập nhật trạng thái');
            inp.checked = !inp.checked;
        }
    } catch (loi) {
        console.error(loi);
        alert('Không thể kết nối tới server!');
        inp.checked = !inp.checked;
    }
}

async function xoaNguoiDung(taikhoan) {
    if(window.confirm('Xác nhận xóa '+taikhoan+'? \nMọi dữ liệu về '+taikhoan+' sẽ mất! Bao gồm cả những đơn hàng của '+taikhoan)) {
        try {
            const response = await fetch('http://localhost:3000/api/admin/users?username=' + encodeURIComponent(taikhoan), {
                method: 'DELETE',
                credentials: 'include'
            });
            const result = await response.json();
            if (result.success) {
                alert('Xóa tài khoản thành công');
                await addTableKhachHang();
                await addTableDonHang();
            } else {
                alert(result.error.message || 'Lỗi khi xóa người dùng');
            }
        } catch (loi) {
            console.error(loi);
            alert('Không thể kết nối tới server!');
        }
    }
}

// Sắp xếp
function sortKhachHangTable(loai) {
    var list = document.getElementsByClassName('khachhang')[0].getElementsByClassName("table-content")[0];
    var tr = list.getElementsByTagName('tr');

    quickSort(tr, 0, tr.length-1, loai, getValueOfTypeInTable_KhachHang); 
    decrease = !decrease;
}

function getValueOfTypeInTable_KhachHang(tr, loai) {
    var td = tr.getElementsByTagName('td');
    switch(loai) {
        case 'stt': return Number(td[0].innerHTML);
        case 'hoten' : return td[1].innerHTML.toLowerCase();
        case 'email' : return td[2].innerHTML.toLowerCase();
        case 'taikhoan' : return td[3].innerHTML.toLowerCase();    
        case 'matkhau' : return td[4].innerHTML.toLowerCase(); 
    }
    return false;
}

// ================== Sort ====================
// https://github.com/HoangTran0410/First_html_css_js/blob/master/sketch.js
var decrease = true; // Sắp xếp giảm dần

// loại là tên cột, func là hàm giúp lấy giá trị từ cột loai
function quickSort(arr, left, right, loai, func) {
    var pivot,
        partitionIndex;

    if (left < right) {
        pivot = right;
        partitionIndex = partition(arr, pivot, left, right, loai, func);

        //sort left and right
        quickSort(arr, left, partitionIndex - 1, loai, func);
        quickSort(arr, partitionIndex + 1, right, loai, func);
    }
    return arr;
}

function partition(arr, pivot, left, right, loai, func) {
    var pivotValue =  func(arr[pivot], loai),
        partitionIndex = left;
    
    for (var i = left; i < right; i++) {
        if (decrease && func(arr[i], loai) > pivotValue
        || !decrease && func(arr[i], loai) < pivotValue) {
            swap(arr, i, partitionIndex);
            partitionIndex++;
        }
    }
    swap(arr, right, partitionIndex);
    return partitionIndex;
}

function swap(arr, i, j) {
    var tempi = arr[i].cloneNode(true);
    var tempj = arr[j].cloneNode(true);
    arr[i].parentNode.replaceChild(tempj, arr[i]);
    arr[j].parentNode.replaceChild(tempi, arr[j]);
}

// ================= các hàm thêm ====================
// Chuyển khuyến mãi vễ dạng chuỗi tiếng việt
function promoToStringValue(pr) {
    switch (pr.name) {
        case 'tragop':
            return 'Góp ' + pr.value + '%';
        case 'giamgia':
            return 'Giảm ' + pr.value;
        case 'giareonline':
            return 'Online (' + pr.value + ')';
        case 'moiramat':
            return 'Mới';
    }
    return '';
}

function progress(percent, bg, width, height) {

    return `<div class="progress" style="width: ` + width + `; height:` + height + `">
                <div class="progress-bar bg-info" style="width: ` + percent + `%; background-color:` + bg + `"></div>
            </div>`
}

// for(var i = 0; i < list_products.length; i++) {
//     list_products[i].masp = list_products[i].company.substring(0, 3) + vitriCompany(list_products[i], i);
// }

// console.log(JSON.stringify(list_products));
