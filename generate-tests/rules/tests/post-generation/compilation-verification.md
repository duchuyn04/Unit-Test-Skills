---
title: Xác minh compilation sau khi sinh test
impact: HIGH
impactDescription: bảo đảm test đã sinh compile thành công trước khi bàn giao
tags: csharp, dotnet, tests, compilation, verification, build
---

## Xác minh compilation sau khi sinh test

Sau khi tạo test file, phải build test project và sửa mọi compilation error trước khi hoàn thành.

### Command

Ưu tiên build đúng test project để phản hồi nhanh:

```powershell
dotnet build tests/MyApp.Tests/MyApp.Tests.csproj --no-restore
```

Nếu dependency vừa thay đổi hoặc assets file chưa tồn tại:

```powershell
dotnet restore tests/MyApp.Tests/MyApp.Tests.csproj
dotnet build tests/MyApp.Tests/MyApp.Tests.csproj --no-restore
```

Chỉ build toàn solution khi thay đổi ảnh hưởng nhiều project hoặc không xác định được test project riêng.

### Quy trình

1. Tạo hoặc cập nhật test file đúng vị trí.
2. Chạy `dotnet build` cho test project.
3. Nếu build thất bại:
   - Đọc compiler error đầy đủ.
   - Sửa namespace, `using`, type, nullable warning được nâng thành error hoặc cú pháp.
   - Chỉ thêm package khi test thực sự cần và dự án chưa có package tương đương.
   - Chạy build lại.
4. Lặp đến khi thành công, tối đa 5 lần. Nếu vẫn thất bại, báo lỗi còn lại cho người dùng.

### Lỗi thường gặp

**Thiếu namespace:**

```csharp
// CS0246: Không tìm thấy type hoặc namespace
using Xunit;
using Moq;
```

**Thiếu package reference:**

```xml
<ItemGroup>
  <PackageReference Include="Microsoft.NET.Test.Sdk" Version="..." />
  <PackageReference Include="xunit" Version="..." />
  <PackageReference Include="xunit.runner.visualstudio" Version="..." />
  <PackageReference Include="Moq" Version="..." />
</ItemGroup>
```

Giữ version đang dùng trong solution. Không tự chọn version mới nếu repository đã quản lý package tập trung.

**Namespace không khớp:**

```csharp
namespace MyApp.Tests.Services;
```

Namespace phải theo quy ước hiện có của test project, không bắt buộc phụ thuộc đường dẫn thư mục nếu dự án dùng file-scoped namespace khác.

**Sai type:**

```csharp
long actualResult = 123;

Assert.Equal(123L, actualResult);
```

### Checklist

- [ ] Test file nằm trong đúng test project.
- [ ] Namespace và `using` đúng.
- [ ] Package cần thiết đã có.
- [ ] Nullable annotation phù hợp.
- [ ] Không có syntax hoặc type error.
- [ ] `dotnet build` thành công.

Không bàn giao test chưa compile.
