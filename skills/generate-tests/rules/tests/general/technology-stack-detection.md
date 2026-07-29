---
title: Nhận diện C#/.NET test stack
impact: MEDIUM
impactDescription: bảo đảm test dùng đúng project, framework và quy ước .NET
tags: tests, csharp, dotnet, xunit, detection, conventions
---

## Nhận diện C#/.NET test stack

Trước khi viết test, hãy đọc solution và test project để nhận diện framework cùng library hiện có.

### File cần kiểm tra

| File | Nội dung cần xác định |
|------|------------------------|
| `*.sln` / `*.slnx` | Project nguồn và test project liên quan |
| `*.csproj` | Target framework, project reference và package reference |
| `Directory.Packages.props` | Version package được quản lý tập trung |
| `Directory.Build.props` | Nullable, warning, analyzer và convention dùng chung |
| `global.json` | .NET SDK mà repository yêu cầu |
| `GlobalUsings.cs` | Namespace đã được import toàn cục |

### Vị trí test file

- Test project thường có dạng `<Project>.Tests`.
- Test file có dạng `<ClassName>Tests.cs`.
- Giữ cấu trúc thư mục và namespace giống các test lân cận.
- Không đặt test vào production project.

### Nhận diện library

- Nếu project dùng xUnit, giữ `[Fact]`, `[Theory]` và `Assert`.
- Nếu project dùng Moq, giữ `Mock<T>`, `Setup` và `Verify`.
- Nếu đã dùng FluentAssertions, Shouldly, NSubstitute hoặc FakeItEasy, tiếp tục dùng library đó; không thêm library thứ hai.
- Kiểm tra `Microsoft.NET.Test.Sdk` và test runner trước khi thêm package.

### Quy ước mặc định

Khi project chưa có convention rõ ràng:

1. Dùng xUnit.
2. Dùng Moq cho dependency.
3. Đặt tên test method theo `Method_GivenState_ExpectedOutcome` và PascalCase.
4. Đặt test trong `<Project>.Tests/<Feature>/<ClassName>Tests.cs`.
5. Dùng Arrange-Act-Assert.
6. Build bằng `dotnet build` và chạy bằng `dotnet test`.

**Không đúng:**

```csharp
// Tên không theo quy ước xUnit và đặt sai project
// src/MyApp/Tests/CalculatorTest.cs
public void test_calculate_total() { }
```

**Đúng:**

```csharp
// tests/MyApp.Tests/Services/CalculatorTests.cs
[Fact]
public void CalculateTotal_ValidInput_ReturnsSum() { }
```
