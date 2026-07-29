---
title: Nguyên tắc kiểm thử chung
impact: HIGH
impactDescription: bảo đảm test dễ bảo trì, đáng tin cậy và tập trung vào hành vi
tags: tests, principles, patterns, best-practices
---

## Nguyên tắc kiểm thử chung

### 1. Dùng Arrange-Act-Assert

Mỗi test cần tách rõ setup, hành động và xác minh.

```csharp
[Fact]
public void CalculateTotal_ValidProducts_ReturnsSum()
{
    // Arrange
    var products = new[]
    {
        new Product("A", 50m),
        new Product("B", 100m)
    };
    _repositoryMock.Setup(x => x.FindAll()).Returns(products);

    // Act
    var actualTotal = _service.CalculateTotal();

    // Assert
    const decimal expectedTotal = 150m;
    Assert.Equal(expectedTotal, actualTotal);
}
```

### 2. Phân biệt actual và expected

Đặt tên biến để thứ tự assertion rõ ràng.

```csharp
var actualUser = _service.GetUser(id);
const string expectedName = "John Doe";

Assert.Equal(expectedName, actualUser.Name);
```

### 3. Kiểm thử hành vi, không kiểm thử implementation

Không viết test để xác minh service dùng LINQ, parallel loop hoặc một private helper cụ thể. Hãy xác minh kết quả quan sát được.

```csharp
[Fact]
public void CalculateTotal_LargeDataset_ReturnsCorrectSum()
{
    var products = CreateProductsWithTotal(1_000m);
    _repositoryMock.Setup(x => x.FindAll()).Returns(products);

    var actualTotal = _service.CalculateTotal();

    Assert.Equal(1_000m, actualTotal);
}
```

### 4. Giữ test deterministic và đơn giản

Inject clock, random source hoặc ID generator thay vì đọc giá trị môi trường trực tiếp.

```csharp
[Fact]
public void CreateOrder_ValidRequest_SetsCurrentTimestamp()
{
    var fixedTime = new DateTimeOffset(2024, 1, 1, 0, 0, 0, TimeSpan.Zero);
    var timeProvider = new FakeTimeProvider(fixedTime);
    var service = new OrderService(timeProvider);

    var actualOrder = service.CreateOrder();

    Assert.Equal(fixedTime, actualOrder.Timestamp);
}
```

### 5. Chỉ mock dependency

Không mock system under test hoặc value object đơn giản.

```csharp
[Fact]
public void ProcessOrder_ValidProduct_CalculatesTotal()
{
    var product = new Product("Test", 100m);

    var actualResult = _service.ProcessOrder(product);

    Assert.Equal(100m, actualResult.Total);
}
```

### 6. Dùng helper và builder để giảm nhiễu

Tách setup lặp lại khi helper làm test dễ đọc hơn. Không đưa business logic vào helper.

```csharp
[Fact]
public void Authorize_AdminUser_ReturnsAllowed()
{
    var user = CreateUser("John", "john@test.com", Role.Admin);

    var actualResult = _service.Authorize(user);

    Assert.True(actualResult.IsAllowed);
}

private static User CreateUser(string name, string email, Role role) =>
    new()
    {
        Name = name,
        Email = email,
        Role = role
    };
```
