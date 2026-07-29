---
title: Xác minh logging output
impact: MEDIUM
impactDescription: hỗ trợ kiểm thử log event và console output
tags: csharp, dotnet, tests, logging, ilogger, console
---

## Xác minh logging output

Ưu tiên xác minh structured logging qua `ILogger<T>`. Chỉ capture `Console.Out` hoặc `Console.Error` khi console output là public contract của ứng dụng.

### Rule

- Với `ILogger<T>`, xác minh log level, message template và field liên quan.
- Không phụ thuộc vào timestamp, event order hoặc format của logging provider nếu chúng không thuộc hành vi.
- Có thể dùng `FakeLogger<T>` khi test project đã tham chiếu `Microsoft.Extensions.Diagnostics.Testing`. Không tự thêm package nếu dự án đã có cách kiểm tra logging khác.
- Nếu redirect console, luôn khôi phục writer bằng `try/finally`.
- Không assertion log chỉ để tăng coverage.

### Dùng `FakeLogger<T>`

Phần này chỉ áp dụng khi test project đã có package `Microsoft.Extensions.Diagnostics.Testing`.

```csharp
public sealed class OrderServiceTests
{
    private readonly FakeLogger<OrderService> _logger = new();
    private readonly OrderService _service;

    public OrderServiceTests()
    {
        _service = new OrderService(_logger);
    }

    [Fact]
    public void ProcessOrder_ValidOrder_LogsOrderId()
    {
        var order = new Order("order-123", "product-1");

        _service.ProcessOrder(order);

        var record = Assert.Single(_logger.Collector.GetSnapshot());
        Assert.Equal(LogLevel.Information, record.Level);
        Assert.Contains("order-123", record.Message);
    }

    [Fact]
    public void ProcessOrder_InvalidOrder_LogsError()
    {
        var invalidOrder = new Order(null, "product-1");

        Assert.Throws<ArgumentException>(
            () => _service.ProcessOrder(invalidOrder));

        var record = Assert.Single(_logger.Collector.GetSnapshot());
        Assert.Equal(LogLevel.Error, record.Level);
        Assert.Contains("Invalid order", record.Message);
    }
}
```

### Dùng Moq với `ILogger<T>`

`ILogger.Log<TState>` là generic method. Chỉ dùng mẫu này khi dự án chưa có `FakeLogger<T>`.

```csharp
_loggerMock.Verify(
    logger => logger.Log(
        LogLevel.Information,
        It.IsAny<EventId>(),
        It.Is<It.IsAnyType>((state, _) =>
            state.ToString()!.Contains("order-123")),
        null,
        It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
    Times.Once);
```

### Capture console output

```csharp
[Fact]
public void Run_ValidInput_WritesConfirmation()
{
    var originalOut = Console.Out;
    using var writer = new StringWriter();

    try
    {
        Console.SetOut(writer);

        _application.Run();

        Assert.Contains("Order processed", writer.ToString());
    }
    finally
    {
        Console.SetOut(originalOut);
    }
}
```

### Nội dung cần xác minh

1. **Log level**: Information, Warning, Error hoặc Critical.
2. **Message/template**: nội dung nghiệp vụ cần thiết.
3. **Structured property**: order ID, user ID hoặc correlation ID liên quan.
4. **Exception**: exception đúng được gắn với error log.
5. **Số lần ghi log**: chỉ khi số lần là hành vi cần kiểm thử.

Không xác minh toàn bộ chuỗi log đã format nếu timestamp, category hoặc provider có thể thay đổi.
