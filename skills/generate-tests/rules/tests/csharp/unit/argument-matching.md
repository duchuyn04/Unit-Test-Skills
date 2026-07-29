---
title: Argument Matching trong Moq
impact: HIGH
impactDescription: bảo đảm việc xác minh argument có ý nghĩa
tags: csharp, dotnet, tests, moq, argument-matching, verification
---

## Argument Matching trong Moq

Với DTO và model object, hãy capture argument thật rồi assertion các field liên quan. Không dùng `It.IsAny<T>()` nếu giá trị được truyền đi chính là hành vi cần kiểm thử.

### Rule

- Không dùng `It.IsAny<T>()` cho DTO/model trong `Setup` hoặc `Verify` khi test cần xác minh dữ liệu.
- Dùng predicate `It.Is<T>(...)` cho điều kiện ngắn và rõ.
- Dùng `Callback<T>` để capture object phức tạp rồi assertion các field liên quan.
- Không assertion field không liên quan đến kịch bản.

**Không đúng:**

```csharp
[Fact]
public void CreateOrder_ValidRequest_CallsRepository()
{
    _service.CreateOrder(new OrderRequest("product-1", 5));

    _repositoryMock.Verify(x => x.Save(It.IsAny<Order>()), Times.Once);
}
```

**Đúng với predicate:**

```csharp
[Fact]
public void CreateOrder_ValidRequest_SavesCorrectOrder()
{
    var request = new OrderRequest("product-1", 5);

    _service.CreateOrder(request);

    _repositoryMock.Verify(
        x => x.Save(It.Is<Order>(order =>
            order.ProductId == "product-1" &&
            order.Quantity == 5)),
        Times.Once);
}
```

**Đúng khi cần capture object:**

```csharp
[Fact]
public void SendNotification_ValidUser_SendsCorrectEmail()
{
    EmailMessage? capturedMessage = null;
    _emailServiceMock
        .Setup(x => x.Send(It.IsAny<EmailMessage>()))
        .Callback<EmailMessage>(message => capturedMessage = message);
    var user = new User("john@test.com", "John");

    _service.NotifyUser(user);

    Assert.NotNull(capturedMessage);
    Assert.Equal("john@test.com", capturedMessage.To);
    Assert.Contains("John", capturedMessage.Subject);
}
```

### Khi nào có thể dùng `It.IsAny<T>()`

Chỉ dùng khi argument không thuộc hành vi đang kiểm thử:

- Xác minh số lần gọi method.
- Argument hạ tầng như `CancellationToken` khi test không kiểm tra cancellation.
- Argument khác đã có test riêng.
- Primitive hoặc string không ảnh hưởng kết quả của kịch bản hiện tại.

```csharp
_loggerMock.Verify(x => x.Log(It.IsAny<string>()), Times.Exactly(3));

_cacheMock
    .Setup(x => x.Get(It.IsAny<string>()))
    .Returns((CacheEntry?)null);
```

### Capture nhiều lần gọi

```csharp
[Fact]
public void SaveAll_TwoOrders_SavesBothOrders()
{
    var capturedOrders = new List<Order>();
    _repositoryMock
        .Setup(x => x.Save(It.IsAny<Order>()))
        .Callback<Order>(capturedOrders.Add);

    _service.SaveAll(CreateTwoOrders());

    Assert.Equal(2, capturedOrders.Count);
}
```
