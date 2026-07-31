---
title: Xác minh chạy test sau khi sinh
impact: HIGH
impactDescription: phân loại chính xác test pass, test lỗi và regression test phát hiện production bug
tags: csharp, dotnet, xunit, tests, execution, verification
---

## Xác minh chạy test sau khi sinh

Sau khi build thành công, chạy test vừa tạo. Mục tiêu không phải làm mọi test pass bằng mọi giá mà là xác định test đúng, production code đúng contract hay có sai lệch cần báo.

### Chạy đúng phạm vi

Ưu tiên chạy test class vừa tạo:

```powershell
dotnet test tests/MyApp.Tests/MyApp.Tests.csproj --no-build --filter "FullyQualifiedName~OrderServiceTests"
```

Chạy một test method khi cần chẩn đoán nhanh:

```powershell
dotnet test tests/MyApp.Tests/MyApp.Tests.csproj --no-build --filter "FullyQualifiedName~OrderServiceTests.CreateOrder_ValidRequest_SavesOrder"
```

Sau khi xử lý kết quả test mục tiêu, luôn chạy toàn test project và so sánh với baseline đã ghi trước khi sinh test:

```powershell
dotnet test tests/MyApp.Tests/MyApp.Tests.csproj --no-build
```

Nếu baseline đã có failure, liệt kê failure cũ và xác nhận không xuất hiện failure mới ngoài regression test có căn cứ vừa tạo. Nếu không thể chạy full project vì giới hạn môi trường hoặc thời gian, phải được người dùng chấp nhận rõ ràng và ghi trạng thái `FULL_SUITE_NOT_VERIFIED`; không mô tả kết quả là đã production-ready.

### Khi test thất bại

1. Đọc đầy đủ failure output và stack trace.
2. Phân loại root cause:
   - **Test defect:** expected không có căn cứ, setup mock sai, thiếu `Returns`/`Throws`, state bị chia sẻ hoặc async method chưa được `await`.
   - **Production defect:** actual behavior vi phạm requirement, public contract, validation, authorization policy hoặc invariant đã ghi trong test case.
   - **Contract chưa rõ:** chỉ biết implementation hiện tại nhưng không có nguồn độc lập để kết luận đúng sai.
3. Với test defect, sửa test rồi chạy lại tối đa 3 lần.
4. Với production defect, giữ regression test ở trạng thái fail; không đổi expected value và không xóa test.
5. Với contract chưa rõ, đánh dấu Characterization và hỏi người dùng trước khi chốt expected outcome.

### Lỗi thường gặp

**Expected value có căn cứ:**

```csharp
// API contract quy định tên trả về là "John"
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

- Mọi test phải compile; compilation failure không được xem là production bug.
- Có thể bàn giao regression test đang fail khi failure tái hiện được và expected outcome có nguồn độc lập rõ ràng.
- Không sửa production code để ép test pass nếu người dùng chỉ yêu cầu tạo test.
- Chạy write-boundary check trước khi bàn giao. Nếu production, project file hoặc config chưa được duyệt đã thay đổi, dừng với `WRITE_BOUNDARY_VIOLATION`; không tự động revert file chưa rõ chủ sở hữu.
- Nếu test chỉ có thể viết sau khi refactor production, trả về `TESTABILITY_BLOCKER` và chờ quyền sửa production riêng.
- Không dùng hành vi hiện tại làm expected nếu nó mâu thuẫn với contract.
- Không xóa test thất bại để tạo cảm giác mọi thứ đã pass.
- Với mỗi regression test fail, báo test name, command, expected, actual và căn cứ kỳ vọng.
- Không gọi một Characterization failure là bug khi contract chưa rõ.
- Báo kết quả full project so với baseline: tổng pass/fail/skip trước và sau, failure mới, failure đã hết và lý do của mọi chênh lệch.
