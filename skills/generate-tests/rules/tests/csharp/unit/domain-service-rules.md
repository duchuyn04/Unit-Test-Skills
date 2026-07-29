---
title: Rule unit test cho domain và service
impact: HIGH
impactDescription: bảo đảm unit test cho business logic chạy nhanh và độc lập
tags: csharp, dotnet, tests, unit, domain, service, moq
---

## Rule unit test cho domain và service

Dùng xUnit và Moq để kiểm thử service cùng domain logic. Test phải chạy nhanh, độc lập và không khởi động framework.

### Rule

- Tạo mock bằng `Mock<T>` và inject dependency qua constructor.
- Không khởi động ASP.NET Core host, database hoặc container trong unit test.
- Mock dependency bên ngoài, không mock system under test.
- Không mock value object đơn giản.
- Capture argument khi dữ liệu truyền vào dependency là hành vi cần xác minh.

**Không đúng:**

```csharp
// Khởi động toàn bộ ASP.NET Core host cho unit test
public sealed class OrderServiceTests : IClassFixture<WebApplicationFactory<Program>>
{
    // ...
}

// Mock value object không cần thiết
var productMock = new Mock<IProduct>();
productMock.SetupGet(x => x.Price).Returns(100m);
```

**Đúng:**

```csharp
public sealed class OrderServiceTests
{
    private readonly Mock<IOrderRepository> _repositoryMock = new();
    private readonly Mock<IPaymentService> _paymentServiceMock = new();
    private readonly OrderService _service;

    public OrderServiceTests()
    {
        _service = new OrderService(
            _repositoryMock.Object,
            _paymentServiceMock.Object);
    }

    [Fact]
    public void CreateOrder_ValidRequest_SavesAndReturnsOrder()
    {
        Order? capturedOrder = null;
        var request = new OrderRequest("product-1", 5);
        var savedOrder = new Order("order-123", "product-1", 5);
        _repositoryMock
            .Setup(x => x.Save(It.IsAny<Order>()))
            .Callback<Order>(order => capturedOrder = order)
            .Returns(savedOrder);

        var actualOrder = _service.CreateOrder(request);

        Assert.Equal("order-123", actualOrder.Id);
        Assert.NotNull(capturedOrder);
        Assert.Equal("product-1", capturedOrder.ProductId);
        Assert.Equal(5, capturedOrder.Quantity);
    }

    [Fact]
    public void ProcessPayment_ValidOrder_CallsPaymentService()
    {
        var order = new Order("order-123", "product-1", 5) { Total = 500m };
        _paymentServiceMock
            .Setup(x => x.Charge("order-123", 500m))
            .Returns(true);

        var actualResult = _service.ProcessPayment(order);

        Assert.True(actualResult);
        _paymentServiceMock.Verify(
            x => x.Charge("order-123", 500m),
            Times.Once);
    }

    [Fact]
    public void ProcessPayment_PaymentFails_ThrowsPaymentException()
    {
        var order = new Order("order-123", "product-1", 5) { Total = 500m };
        _paymentServiceMock
            .Setup(x => x.Charge("order-123", 500m))
            .Returns(false);

        var exception = Assert.Throws<PaymentException>(
            () => _service.ProcessPayment(order));

        Assert.Contains("Payment failed", exception.Message);
    }

    [Fact]
    public void CalculateTotal_MultipleProducts_ReturnsSumOfPrices()
    {
        var products = new[]
        {
            new Product("A", 50m),
            new Product("B", 100m)
        };
        var order = new Order(products);

        var actualTotal = _service.CalculateTotal(order);

        Assert.Equal(150m, actualTotal);
    }
}
```

### Đối tượng nên mock

- Repository và DAO.
- External service client.
- Message producer.
- Cache service.
- I/O operation.
- Clock, time provider hoặc random source khi cần test deterministic.

### Đối tượng nên dùng thật

- DTO và value object.
- Domain entity trong phần lớn trường hợp.
- Utility class đơn giản.
- Mapper không có I/O.

### Mẫu xác minh interaction

```csharp
_repositoryMock.Verify(
    x => x.Save(It.Is<Order>(order => order.ProductId == "product-1")),
    Times.Once);

_notificationServiceMock.Verify(
    x => x.Send(It.IsAny<Notification>()),
    Times.Never);

_repositoryMock.Verify(
    x => x.FindById(It.IsAny<string>()),
    Times.Exactly(2));

_paymentServiceMock.VerifyNoOtherCalls();
```
