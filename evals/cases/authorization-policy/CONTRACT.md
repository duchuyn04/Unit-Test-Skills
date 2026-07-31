# Delete-user endpoint contract

Request không có identity hợp lệ phải trả 401.
User đã đăng nhập nhưng không có role Admin phải nhận 403.
Admin xóa user tồn tại phải nhận 204.
Admin xóa user không tồn tại phải nhận 404.
