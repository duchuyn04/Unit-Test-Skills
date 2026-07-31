---
title: Nhận biết test hiện có
impact: HIGH
impactDescription: tránh test trùng lặp và bảo đảm nhất quán với quy ước dự án
tags: tests, awareness, duplicates, conventions, style
---

## Nhận biết test hiện có

Trước khi tạo test, hãy kiểm tra nội dung đã có. Tuân theo quy ước kiểm thử của dự án và tránh lặp lại độ bao phủ.

### Kiểm tra test hiện có trước khi tạo

1. **Tìm test class hiện có** cho đối tượng cần phân tích:
   - Tìm `{ClassName}Test` hoặc `{ClassName}Tests` trong thư mục test.
   - Tìm thêm reference tới constructor, fully-qualified type hoặc public method của target vì test có thể được tổ chức theo feature thay vì theo tên class.
   - Nếu tìm thấy, đọc toàn bộ trước khi tạo nội dung mới.

2. **Nếu tìm thấy test class hiện có:**
   - Không tạo test class mới; thêm test method còn thiếu vào class hiện có.
   - Giữ nguyên cấu trúc test, import và helper method hiện có.
   - Theo đúng pattern đang dùng về cách đặt tên, assertion và setup.
   - Chỉ thêm test cho hành vi chưa được bao phủ.

3. **Nếu không tìm thấy test class hiện có:**
   - Đọc 2 đến 3 test class lân cận trong cùng package để hiểu quy ước dự án.
   - Tuân theo style về thứ tự import, assertion library, mẫu đặt tên và comment.

### Nội dung cần tuân theo từ test hiện có

- **Assertion library**: giữ xUnit `Assert`, FluentAssertions hoặc Shouldly mà dự án đang dùng.
- **Test data pattern**: nếu dự án có `TestDataFactory` hoặc builder, hãy sử dụng chúng.
- **Base test class**: nếu test kế thừa `BaseTest` hoặc `AbstractIntegrationTest`, hãy theo pattern đó.
- **Static import style**: tuân theo cách dự án import assertion method.
- **Comment style**: giữ cách dùng `// given / when / then` hoặc `// arrange / act / assert` của test hiện có.

### Những việc không được làm

**Không đúng:**

```csharp
// Tạo test class mới trong khi class tương ứng đã tồn tại
// File: UserServiceTests.cs (MỚI nhưng trùng lặp)
public sealed class UserServiceTests {
    // Có 10 test method nhưng 5 method đã tồn tại trong file cũ
}
```

**Đúng:**

```csharp
// Chỉ thêm test còn thiếu vào file hiện có
// File: UserServiceTests.cs (HIỆN CÓ và được bổ sung)
public sealed class UserServiceTests {

    // ... giữ nguyên test hiện có ...

    // Thêm test mới bên dưới test hiện có
    [Fact]
    public void UpdateUser_InvalidEmail_ThrowsValidationException() { }
}
```

### Checklist trước khi quyết định

Trước khi viết mã kiểm thử, hãy xác nhận:
- [ ] Đã tìm test class hiện có cho đối tượng cần phân tích.
- [ ] Đã đọc test hiện có để hiểu phần đã được bao phủ.
- [ ] Đã xác định quy ước kiểm thử của dự án từ các test file lân cận.
- [ ] Đã xác nhận hành vi vẫn cần được kiểm thử.
