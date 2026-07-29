---
title: Tạo test data rõ ràng
impact: HIGH
impactDescription: giúp test dễ đọc và dễ bảo trì nhờ cách chuẩn bị dữ liệu rõ ràng
tags: tests, test-data, helpers, builders, readability
---

## Tạo test data rõ ràng

Dùng helper và builder để tạo test data. Chỉ đưa vào test những chi tiết cần thiết cho kịch bản.

### Dùng helper

**Không đúng:**

```csharp
[Fact]
public void CalculateTotal_MultipleItems_ReturnsTotal()
{
    var cart = new ShoppingCart(
        new DefaultRoundingStrategy(),
        "unused",
        RoundingMode.Normal,
        false,
        false,
        TimeZoneInfo.Utc,
        null);

    var actualTotal = cart.CalculateTotal(
        CreateItem1(),
        CreateItem2(),
        CreateItem3());

    Assert.Equal(25, actualTotal);
}
```

**Đúng:**

```csharp
[Fact]
public void CalculateTotal_MultipleItems_ReturnsTotal()
{
    var cart = CreateShoppingCart();

    var actualTotal = cart.CalculateTotal(
        CreateItemWithPrice(10m),
        CreateItemWithPrice(10m),
        CreateItemWithPrice(5m));

    Assert.Equal(25m, actualTotal);
}
```

### Dùng Test Data Builder

Khi helper có quá nhiều parameter, hãy chuyển sang builder có giá trị mặc định hợp lệ.

```csharp
var smallCompany = CompanyBuilder.Default()
    .WithEmployeeCount(2)
    .WithBoardMemberCount(2)
    .Build();

var privateCompany = CompanyBuilder.Default()
    .WithType(CompanyType.Private)
    .Build();

var bankruptCompany = CompanyBuilder.Default()
    .WithBankruptcyDate(PastDate)
    .Build();
```

### Không phụ thuộc ngầm vào mặc định

Nếu test phụ thuộc vào một giá trị, hãy đặt giá trị đó rõ ràng dù builder đã có cùng mặc định.

```csharp
[Fact]
public void Validate_PublicCompanyWithNoBoardMembers_ReturnsInvalid()
{
    var company = CompanyBuilder.Default()
        .WithType(CompanyType.Public)
        .WithBoardMemberCount(0)
        .Build();

    var actualResult = _validator.Validate(company);

    Assert.False(actualResult.IsValid);
}
```

### Hướng dẫn

1. Đặt tên helper theo dữ liệu nó tạo, ví dụ `CreateProductWithCategory("Office")`.
2. Chỉ nhận parameter liên quan đến kịch bản.
3. Không đặt business logic trong helper.
4. Dùng builder khi cần nhiều tổ hợp property.
5. Builder phải tạo object hợp lệ theo mặc định.
