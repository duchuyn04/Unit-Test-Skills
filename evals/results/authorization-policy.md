# Fixture: `authorization-policy`

**Target:** `src/AdminUsersController.cs`
**Contract:** `CONTRACT.md`
**Coverage hiện có:** `Delete_AdminAndExistingUser_Returns204` đã thể hiện coverage dự kiến cho admin xóa user tồn tại qua HTTP pipeline tại `tests/DeleteUserFeatureTests.cs:5`. Không đề xuất lại kịch bản 204.

Các case 401 và 403 phải chạy qua ASP.NET Core authorization pipeline; gọi trực tiếp controller action sẽ bỏ qua `[Authorize]`.

## Test case cho AdminUsersController.Delete

### 1. `Delete_Unauthenticated_Returns401`

- **Given:** Request `DELETE /api/admin/users/{id}` không có authenticated identity hợp lệ.
- **When:** Gửi request qua HTTP pipeline.
- **Then:** Response có status `401 Unauthorized`, và `IUserService.DeleteAsync` không được gọi.
- **Code branch:** Authorization middleware xử lý `[Authorize(Roles = "Admin")]` trước khi controller action được thực thi.
- **Căn cứ kỳ vọng:** `CONTRACT.md:3`; authorization policy khai báo tại `src/AdminUsersController.cs:8`.
- **Rủi ro:** Endpoint cho phép request chưa đăng nhập đi tới thao tác xóa hoặc trả nhầm 403.
- **Loại:** Contract

### 2. `Delete_AuthenticatedWithoutAdminRole_Returns403`

- **Given:** Request có authenticated identity hợp lệ nhưng principal không có role `Admin`.
- **When:** Gửi request qua HTTP pipeline.
- **Then:** Response có status `403 Forbidden`, và `IUserService.DeleteAsync` không được gọi.
- **Code branch:** Authorization middleware xác thực thành công nhưng từ chối do không thỏa role `Admin`.
- **Căn cứ kỳ vọng:** `CONTRACT.md:4`; yêu cầu role tại `src/AdminUsersController.cs:8`.
- **Rủi ro:** Role policy không được áp dụng, cho phép user thường xóa user hoặc trả nhầm 401.
- **Loại:** Contract

### 3. `Delete_AdminAndMissingUser_Returns404`

- **Given:** Request đến từ principal có role `Admin`, và `IUserService.DeleteAsync` trả về `false` cho user không tồn tại.
- **When:** Gửi request xóa user qua HTTP pipeline.
- **Then:** Response có status `404 Not Found`.
- **Code branch:** Nhánh `false` của biểu thức điều kiện trong `Delete`.
- **Căn cứ kỳ vọng:** `CONTRACT.md:6`; mapping kết quả service tại `src/AdminUsersController.cs:12-13`.
- **Rủi ro:** Controller ánh xạ sai kết quả “không tìm thấy” thành 204 hoặc status khác.
- **Loại:** Contract

Không đề xuất case cancellation hoặc exception từ service vì fixture không cung cấp contract cho các hành vi đó và controller không có nhánh xử lý tương ứng.
