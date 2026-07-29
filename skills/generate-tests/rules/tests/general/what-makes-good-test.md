---
title: Thế nào là một test tốt
impact: HIGH
impactDescription: xác định các phẩm chất cốt lõi mà mọi test cần có
tags: tests, quality, clarity, completeness, conciseness, resilience
---

## Thế nào là một test tốt

Một test tốt cần rõ ràng, đầy đủ, ngắn gọn và bền vững trước thay đổi.

### 1. Rõ ràng

Tên test mô tả kịch bản, cấu trúc Arrange-Act-Assert dễ nhận ra và expected value hiển thị ngay trong test.

**Không đúng:**

```csharp
[Fact]
public void Test1()
{
    var result = _service.Process(CreateData());

    Assert.True(result.IsValid);
}
```

**Đúng:**

```csharp
[Fact]
public void Process_ValidInput_ReturnsValidResult()
{
    var input = CreateValidInput();

    var actualResult = _service.Process(input);

    Assert.True(actualResult.IsValid);
}
```

### 2. Đầy đủ

Test phải chứa đủ thông tin để hiểu kịch bản mà không phải tìm constant hoặc setup ở nơi khác.

```csharp
[Fact]
public void Calculate_MultipleItems_ReturnsSumOfPrices()
{
    _calculator.Add(CreateItemWithPrice(10m));
    _calculator.Add(CreateItemWithPrice(20m));

    var actualTotal = _calculator.Calculate();

    Assert.Equal(30m, actualTotal);
}
```

### 3. Ngắn gọn

Chỉ hiển thị dữ liệu liên quan. Dùng helper để ẩn property không ảnh hưởng kịch bản.

```csharp
[Fact]
public void GetUser_ExistingUser_ReturnsUser()
{
    var user = CreateUser(id: "123", name: "John");
    _repositoryMock.Setup(x => x.FindById("123")).Returns(user);

    var actualUser = _service.GetUser("123");

    Assert.Equal("John", actualUser.Name);
}
```

### 4. Bền vững trước thay đổi

Kiểm thử public behavior và chỉ assertion field thuộc contract. Không phụ thuộc vào thứ tự JSON property, format nội bộ hoặc interaction không liên quan.

**Không đúng:**

```csharp
Assert.Equal(
    """{"name":"John","age":30}""",
    responseJson);
```

**Đúng:**

```csharp
using var document = JsonDocument.Parse(responseJson);

Assert.Equal(
    "John",
    document.RootElement.GetProperty("name").GetString());
```

### Checklist

- [ ] Có thể hiểu test trong khoảng 10 giây.
- [ ] Mọi dữ liệu liên quan đều hiển thị tại chỗ.
- [ ] Chi tiết không liên quan đã được ẩn.
- [ ] Test tiếp tục đúng sau refactoring không làm đổi public contract.
