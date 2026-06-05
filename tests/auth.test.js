const test = require('node:test');
const assert = require('node:assert');
const { xuLyYeuCau } = require('../src/app');
const User = require('../src/features/users/user.model');
const Session = require('../src/features/users/session.model');

test.describe('Kiểm thử API Auth và User', () => {
    test.before(() => {
        User.findOne = async (query) => {
            if (query.username === 'existinguser') {
                return {
                    username: 'existinguser',
                    pass: 'hashed_password',
                    role: 'user',
                    toObject: function() { return { username: this.username, role: this.role }; }
                };
            }
            if (query.username === 'admin') {
                const crypto = require('crypto');
                const hashed = crypto.createHash('sha256').update('adadad').digest('hex');
                return {
                    _id: 'admin_id_123',
                    username: 'admin',
                    pass: hashed,
                    role: 'admin',
                    toObject: function() { return { _id: this._id, username: this.username, role: this.role }; }
                };
            }
            return null;
        };

        User.prototype.save = async function() {
            return this;
        };

        User.findById = (id) => {
            const userObj = {
                _id: id,
                username: 'admin',
                role: 'admin',
                pass: require('crypto').createHash('sha256').update('adadad').digest('hex')
            };
            return {
                ...userObj,
                save: async function() { return this; },
                lean: async () => userObj,
                toObject: function() { return userObj; }
            };
        };

        User.findByIdAndUpdate = async (id, update) => {
            const userObj = {
                _id: id,
                username: 'admin',
                role: 'admin',
                ...update
            };
            return {
                toObject: function() { return userObj; }
            };
        };

        Session.prototype.save = async function() {
            return this;
        };

        Session.findOne = async (query) => {
            if (query.sessionId === 'valid_session_id') {
                return {
                    sessionId: 'valid_session_id',
                    userId: 'admin_id_123',
                    expiresAt: new Date(Date.now() + 10000)
                };
            }
            return null;
        };

        Session.deleteOne = async (query) => {
            return { deletedCount: 1 };
        };
    });

    test.it('Nên đăng ký tài khoản mới thành công', async () => {
        const mockReq = {
            url: '/api/auth/register',
            method: 'POST',
            headers: { host: 'localhost' },
            on: (event, handler) => {
                if (event === 'data') {
                    handler(Buffer.from(JSON.stringify({
                        username: 'newuser',
                        pass: 'password123',
                        ho: 'Nguyen',
                        ten: 'An',
                        email: 'an@gmail.com'
                    })));
                }
                if (event === 'end') {
                    handler();
                }
            }
        };

        let responseBody = '';
        let statusCode = 0;

        const mockRes = {
            writeHead: (status) => {
                statusCode = status;
            },
            end: (data) => {
                responseBody = data;
            }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 200);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, true);
        assert.strictEqual(resJson.data.username, 'newuser');
    });

    test.it('Nên từ chối đăng ký nếu tên đăng nhập đã tồn tại', async () => {
        const mockReq = {
            url: '/api/auth/register',
            method: 'POST',
            headers: { host: 'localhost' },
            on: (event, handler) => {
                if (event === 'data') {
                    handler(Buffer.from(JSON.stringify({
                        username: 'existinguser',
                        pass: 'password123'
                    })));
                }
                if (event === 'end') {
                    handler();
                }
            }
        };

        let responseBody = '';
        let statusCode = 0;

        const mockRes = {
            writeHead: (status) => {
                statusCode = status;
            },
            end: (data) => {
                responseBody = data;
            }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 400);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, false);
        assert.strictEqual(resJson.error.message, 'Tên đăng nhập đã tồn tại');
    });

    test.it('Nên đăng nhập thành công và thiết lập cookie session', async () => {
        const mockReq = {
            url: '/api/auth/login',
            method: 'POST',
            headers: { host: 'localhost' },
            on: (event, handler) => {
                if (event === 'data') {
                    handler(Buffer.from(JSON.stringify({
                        username: 'admin',
                        pass: 'adadad'
                    })));
                }
                if (event === 'end') {
                    handler();
                }
            }
        };

        let responseHeaders = {};
        let responseBody = '';
        let statusCode = 0;

        const mockRes = {
            writeHead: (status, headers) => {
                statusCode = status;
                responseHeaders = headers;
            },
            end: (data) => {
                responseBody = data;
            }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 200);
        assert.ok(responseHeaders['Set-Cookie']);
        assert.ok(responseHeaders['Set-Cookie'].includes('session_id='));

        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, true);
        assert.strictEqual(resJson.data.username, 'admin');
        assert.strictEqual(resJson.data.role, 'admin');
    });

    test.it('Nên lấy được thông tin người dùng từ session cookie hợp lệ', async () => {
        const mockReq = {
            url: '/api/auth/me',
            method: 'GET',
            headers: {
                host: 'localhost',
                cookie: 'session_id=valid_session_id'
            }
        };

        let responseBody = '';
        let statusCode = 0;

        const mockRes = {
            writeHead: (status) => {
                statusCode = status;
            },
            end: (data) => {
                responseBody = data;
            }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 200);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, true);
        assert.strictEqual(resJson.data.username, 'admin');
    });

    test.it('Nên trả về 401 khi lấy thông tin me với cookie không hợp lệ', async () => {
        const mockReq = {
            url: '/api/auth/me',
            method: 'GET',
            headers: {
                host: 'localhost',
                cookie: 'session_id=invalid_session'
            }
        };

        let responseBody = '';
        let statusCode = 0;

        const mockRes = {
            writeHead: (status) => {
                statusCode = status;
            },
            end: (data) => {
                responseBody = data;
            }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 401);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, false);
        assert.strictEqual(resJson.error.code, 'UNAUTHORIZED');
    });

    test.it('Nên đăng xuất thành công và xóa cookie', async () => {
        const mockReq = {
            url: '/api/auth/logout',
            method: 'POST',
            headers: {
                host: 'localhost',
                cookie: 'session_id=valid_session_id'
            },
            on: (event, handler) => {
                if (event === 'end') {
                    handler();
                }
            }
        };

        let responseHeaders = {};
        let responseBody = '';
        let statusCode = 0;

        const mockRes = {
            writeHead: (status, headers) => {
                statusCode = status;
                responseHeaders = headers;
            },
            end: (data) => {
                responseBody = data;
            }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 200);
        assert.ok(responseHeaders['Set-Cookie']);
        assert.ok(responseHeaders['Set-Cookie'].includes('Max-Age=0'));
    });

    test.it('Nên cập nhật thông tin cá nhân thành công', async () => {
        const mockReq = {
            url: '/api/users/profile',
            method: 'PUT',
            headers: {
                host: 'localhost',
                cookie: 'session_id=valid_session_id'
            },
            on: (event, handler) => {
                if (event === 'data') {
                    handler(Buffer.from(JSON.stringify({
                        ho: 'Tran',
                        ten: 'Binh',
                        email: 'binh@gmail.com'
                    })));
                }
                if (event === 'end') {
                    handler();
                }
            }
        };

        let responseBody = '';
        let statusCode = 0;

        const mockRes = {
            writeHead: (status) => {
                statusCode = status;
            },
            end: (data) => {
                responseBody = data;
            }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 200);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, true);
        assert.strictEqual(resJson.data.ho, 'Tran');
        assert.strictEqual(resJson.data.ten, 'Binh');
        assert.strictEqual(resJson.data.email, 'binh@gmail.com');
    });

    test.it('Nên đổi mật khẩu thành công', async () => {
        const mockReq = {
            url: '/api/users/password',
            method: 'PUT',
            headers: {
                host: 'localhost',
                cookie: 'session_id=valid_session_id'
            },
            on: (event, handler) => {
                if (event === 'data') {
                    handler(Buffer.from(JSON.stringify({
                        passCu: 'adadad',
                        passMoi: 'newpassword123'
                    })));
                }
                if (event === 'end') {
                    handler();
                }
            }
        };

        let responseBody = '';
        let statusCode = 0;

        const mockRes = {
            writeHead: (status) => {
                statusCode = status;
            },
            end: (data) => {
                responseBody = data;
            }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 200);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, true);
    });

    test.it('Nên từ chối đổi mật khẩu nếu mật khẩu cũ sai', async () => {
        const mockReq = {
            url: '/api/users/password',
            method: 'PUT',
            headers: {
                host: 'localhost',
                cookie: 'session_id=valid_session_id'
            },
            on: (event, handler) => {
                if (event === 'data') {
                    handler(Buffer.from(JSON.stringify({
                        passCu: 'sai_mat_khau',
                        passMoi: 'newpassword123'
                    })));
                }
                if (event === 'end') {
                    handler();
                }
            }
        };

        let responseBody = '';
        let statusCode = 0;

        const mockRes = {
            writeHead: (status) => {
                statusCode = status;
            },
            end: (data) => {
                responseBody = data;
            }
        };

        await xuLyYeuCau(mockReq, mockRes);

        assert.strictEqual(statusCode, 400);
        const resJson = JSON.parse(responseBody);
        assert.strictEqual(resJson.success, false);
    });
});
