---
title: Quy ước C# xUnit
impact: HIGH
impactDescription: giúp kế hoạch test case phù hợp với dự án .NET và quy ước xUnit
tags: csharp, dotnet, xunit, moq, testing
---

## Quy ước C# xUnit

Áp dụng file này khi đối tượng cần phân tích là C# hoặc dự án có file `.csproj` hay `.sln`. Các quy ước này thay thế ví dụ dành riêng cho Java trong rule chung nhưng không thay đổi nguyên tắc kiểm thử.

### Nhận diện và giữ nguyên stack hiện có

Đọc test project và các test liên quan trước khi đề xuất test case. Dùng framework và thư viện hiện có của dự án. Ưu tiên xUnit nếu dự án chưa chọn framework khác.

- Test project: thường có dạng `<Project>.Tests`.
- Test file: `<ClassName>Tests.cs`.
- Test method: dùng dạng `Method_GivenState_ExpectedOutcome` theo PascalCase.
- Assertion: dùng thư viện hiện có; nếu chưa có, dùng `Assert.Equal`, `Assert.True`, `Assert.Throws<T>` và `Assert.NotNull` của xUnit.
- Mock: giữ nguyên Moq, NSubstitute hoặc FakeItEasy mà dự án đang dùng. Không thêm một mocking library thứ hai.

### Ví dụ xUnit

```csharp
public sealed class OrderServiceTests
{
    [Fact]
    public void CreateOrder_ValidRequest_SavesAndReturnsOrder()
    {
        // Arrange
        var request = new OrderRequest("product-1", 5, "customer-123");

        // Act
        var actualOrder = _service.CreateOrder(request);

        // Assert
        Assert.Equal("product-1", actualOrder.ProductId);
    }
}
```

Chỉ dùng `[Theory]` cùng `[InlineData]` khi mỗi dòng dữ liệu kiểm tra cùng một hành vi và nhánh mã. Không parameterize chỉ để thay đổi kích thước collection hoặc lặp lại cùng một kết quả.

```csharp
[Theory]
[InlineData(0)]
[InlineData(-1)]
public void CreateOrder_NonPositiveQuantity_ThrowsArgumentOutOfRangeException(int quantity)
{
    var request = new OrderRequest("product-1", quantity, "customer-123");

    Assert.Throws<ArgumentOutOfRangeException>(() => _service.CreateOrder(request));
}
```

### Rule phân tích dành riêng cho C#

- Xem nullable parameter (`string?`, `OrderRequest?`) hoặc guard rõ ràng như `ArgumentNullException.ThrowIfNull` là bằng chứng cần test trường hợp null. Không tự thêm trường hợp null cho input non-nullable khi không có guard hoặc contract thể hiện điều đó.
- Xác định mọi `throw`, `return`, nhánh pattern matching, nhánh `switch`, điều kiện, kết quả validation và luồng cancellation tạo ra kết quả quan sát được khác nhau.
- Bao gồm hành vi async khi public API công khai hành vi đó: kết quả thành công, exception được truyền lên và cancellation khi mã thực sự quan sát `CancellationToken`.
- Với HTTP endpoint, tách 400, 401, 403, 404 và 409 thành các kết quả riêng khi mã nguồn phân biệt chúng.
- Kiểm thử logic private gián tiếp qua public method gọi tới nó. Không đề xuất test cho private method chỉ vì method đó tồn tại.
- Với interaction test, chỉ xác minh đối số mock liên quan đến hành vi. Chỉ capture request object để assertion các field đang được kiểm thử.

### Ví dụ tên đầu ra

- `CalculateTotal_ValidProducts_ReturnsSum`
- `CalculateTotal_EmptyList_ThrowsArgumentException`
- `GetUser_Unauthenticated_Returns401`
- `GetUser_Forbidden_Returns403`
- `CreateOrder_CancellationRequested_ThrowsOperationCanceledException`
