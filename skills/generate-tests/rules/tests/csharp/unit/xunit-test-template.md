---
title: Template test C# xUnit
impact: HIGH
impactDescription: bảo đảm cấu trúc test nhất quán và tránh dùng fixture không phù hợp
tags: csharp, dotnet, tests, template, xunit, moq
---

## Template test C# xUnit

Dùng xUnit với cấu trúc nhất quán. Unit test phải chạy nhanh và không khởi động host, database hoặc container nếu kịch bản không yêu cầu.

### CẤM

- Không dùng `WebApplicationFactory`, `TestServer` hoặc DI container trong unit test thuần.
- Không dùng `IClassFixture<T>` chỉ để chia sẻ test data có thể thay đổi.
- Không mock system under test.

**Không đúng:**

```csharp
public sealed class CalculatorServiceTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly CalculatorService _service;

    public CalculatorServiceTests(WebApplicationFactory<Program> factory)
    {
        _service = factory.Services.GetRequiredService<CalculatorService>();
    }

    [Fact]
    public void Calculate_ValidInput_ReturnsResult()
    {
        // ...
    }
}
```

**Đúng:**

```csharp
public sealed class CalculatorServiceTests
{
    private readonly Mock<IDependencyService> _dependencyMock = new();
    private readonly CalculatorService _service;

    public CalculatorServiceTests()
    {
        _service = new CalculatorService(_dependencyMock.Object);
    }

    [Fact]
    public void Calculate_ValidInput_ReturnsResult()
    {
        // Arrange
        _dependencyMock.Setup(x => x.GetValue()).Returns(10);

        // Act
        var actualResult = _service.Calculate(5);

        // Assert
        const int expectedResult = 15;
        Assert.Equal(expectedResult, actualResult);
    }

    [Fact]
    public void Calculate_NegativeInput_ThrowsArgumentOutOfRangeException()
    {
        var exception = Assert.Throws<ArgumentOutOfRangeException>(
            () => _service.Calculate(-1));

        Assert.Equal("input", exception.ParamName);
    }
}
```

### Cấu trúc cơ bản

```csharp
public sealed class {TestedClassName}Tests
{
    [Fact]
    public void {TestedMethod}_{GivenState}_{ExpectedOutcome}()
    {
        // Arrange
        // Act
        // Assert
    }

    [Theory]
    [InlineData(/* input */)]
    public void {TestedMethod}_{AnotherState}_{ExpectedResult}(/* parameters */)
    {
        // Arrange
        // Act
        // Assert
    }
}
```

### Điểm cần nhớ

1. Đặt test trong project `<Project>.Tests` và file `<TestedClassName>Tests.cs`.
2. Dùng constructor của test class để tạo mock và system under test.
3. Dùng Moq `Mock<T>` cho dependency, rồi truyền `.Object` vào constructor.
4. Theo Arrange-Act-Assert và đặt tên method theo PascalCase.
5. Dùng assertion library hiện có; nếu chưa có, dùng assertion của xUnit.
6. Chỉ dùng `[Theory]` khi mọi `InlineData` đi qua cùng một hành vi và nhánh mã.
7. Không so sánh toàn bộ exception message trừ khi chuỗi đó là public contract ổn định. Ưu tiên exception type, `ParamName` và property có cấu trúc; nếu cần kiểm tra custom message, chỉ kiểm tra phần nội dung ổn định.
