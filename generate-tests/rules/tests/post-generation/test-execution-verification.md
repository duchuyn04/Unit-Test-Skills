---
title: Xác minh chạy test sau khi sinh
impact: HIGH
impactDescription: bảo đảm test đã sinh thực sự pass, không chỉ compile
tags: csharp, dotnet, xunit, tests, execution, verification
---

## Xác minh chạy test sau khi sinh

Sau khi build thành công, chạy test vừa tạo và xác nhận tất cả đều pass. Test compile được nhưng thất bại chưa thể bàn giao.

### Chạy đúng phạm vi

Ưu tiên chạy test class vừa tạo:

```powershell
dotnet test tests/MyApp.Tests/MyApp.Tests.csproj --no-build --filter "FullyQualifiedName~OrderServiceTests"
```

Chạy một test method khi cần chẩn đoán nhanh:

```powershell
dotnet test tests/MyApp.Tests/MyApp.Tests.csproj --no-build --filter "FullyQualifiedName~OrderServiceTests.CreateOrder_ValidRequest_SavesOrder"
```

Sau khi test mục tiêu pass, cân nhắc chạy toàn test project nếu thay đổi helper hoặc fixture dùng chung.

### Khi test thất bại

1. Đọc đầy đủ failure output và stack trace.
2. Xác định root cause:
   - Expected value sai.
   - Setup mock không khớp argument.
   - Thiếu `Returns`, `ReturnsAsync` hoặc `ThrowsAsync`.
   - Hiểu sai hành vi production code.
   - State bị chia sẻ giữa các test.
   - Async method chưa được `await`.
3. Sửa test, không sửa production code chỉ để làm test pass.
4. Chạy lại test mục tiêu.
5. Lặp tối đa 3 lần cho mỗi test thất bại. Nếu vẫn không sửa được, báo rõ blocker và failure còn lại; không âm thầm xóa test.

### Lỗi thường gặp

**Expected value sai:**

```csharp
// Production code trả về "John"
Assert.Equal("John", actualUser.Name);
```

**Setup mock không khớp:**

```csharp
_repositoryMock
    .Setup(x => x.FindByIdAsync(
        "1",
        It.IsAny<CancellationToken>()))
    .ReturnsAsync(user);
```

**Setup thừa hoặc interaction sai:**

Chỉ setup method thực sự được gọi trong nhánh mã. Với Moq, dùng `Verify` cho interaction thuộc hành vi đang kiểm thử và tránh `VerifyAll` nếu nó xác minh cả interaction không liên quan.

**Mock trả null mặc định:**

```csharp
_serviceMock
    .Setup(x => x.FindByIdAsync(
        It.IsAny<string>(),
        It.IsAny<CancellationToken>()))
    .ReturnsAsync((User?)null);
```

**Async test viết sai:**

```csharp
[Fact]
public async Task GetUser_ExistingId_ReturnsUser()
{
    var actualUser = await _service.GetUserAsync("1");

    Assert.NotNull(actualUser);
}
```

Không dùng `async void`.

### Nguyên tắc bàn giao

- Không bàn giao test đang fail.
- Không sửa production code để ép test pass nếu người dùng chỉ yêu cầu tạo test.
- Nếu production code có dấu hiệu lỗi, test phải phản ánh contract hoặc hành vi hiện tại và ghi chú nghi vấn rõ ràng.
- Không xóa test thất bại để tạo cảm giác mọi thứ đã pass.
- Báo command đã chạy và kết quả cuối cùng.
