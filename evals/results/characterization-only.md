# Fixture: `characterization-only`

- **Target:** `src/SlugService.cs`
- **Nguồn kỳ vọng độc lập:** Không có.
- **Test hiện có:** Không có.
- **Phân loại:** Chỉ có thể đề xuất Characterization test.

## Test case cho SlugService.Create

### 1. Create_ValueWithOuterWhitespaceMixedCaseAndInternalSpace_ReturnsNormalizedSlug

- **Given:** `value` là `"  Hello World  "`, đồng thời kích hoạt toàn bộ chuỗi biến đổi hiện tại.
- **When:** gọi `Create`.
- **Then:** trả về `"hello-world"`.
- **Code branch:** Luồng thẳng duy nhất tại `src/SlugService.cs:5-6`: loại bỏ whitespace ở hai đầu, chuyển chữ thành lowercase invariant và thay khoảng trắng bên trong bằng dấu gạch ngang.
- **Căn cứ kỳ vọng:** Hành vi hiện tại của `SlugService.Create` tại `src/SlugService.cs:5-6`; chưa có nguồn độc lập chứng minh đây là hành vi nghiệp vụ đúng.
- **Rủi ro:** Refactoring làm thay đổi output tổng hợp của chuỗi chuẩn hóa hiện tại.
- **Loại:** Characterization

## Trường hợp loại trừ

- Không tách test riêng cho `Trim`, `ToLowerInvariant` và `Replace`: đây là straight-line transformation không có branch; rule yêu cầu một input đại diện nhỏ nhất bao phủ toàn bộ chuỗi.
- Không thêm trường hợp `null`: parameter `value` là non-nullable và không có guard hoặc contract yêu cầu xử lý null.
- Không thêm biến thể empty, whitespace-only, nhiều khoảng trắng, punctuation, Unicode hiếm hoặc payload lớn: không có branch, contract hay rủi ro độc lập có bằng chứng để biện minh cho test riêng.
