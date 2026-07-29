---
title: Ưu tiên kiểm thử public API
impact: HIGH
impactDescription: tạo test bền vững trước refactoring
tags: tests, public-api, private-methods, refactoring, resilience
---

## Ưu tiên kiểm thử public API

Kiểm thử hành vi qua public API. Private method và class chứa chi tiết triển khai phải được bao phủ gián tiếp.

### Không kiểm thử chi tiết triển khai

**Không đúng:**

```csharp
[Fact]
public void Validate_FutureDateOfBirth_ThrowsValidationException()
{
    var validator = new UserInfoValidator();

    Assert.Throws<ValidationException>(
        () => validator.Validate(CreateInfoWithFutureDateOfBirth()));
}
```

Test này phụ thuộc trực tiếp vào `UserInfoValidator`, dù validator chỉ là chi tiết nội bộ của service.

**Đúng:**

```csharp
[Fact]
public void Save_FutureDateOfBirth_ThrowsValidationException()
{
    var info = CreateUserInfo(dateOfBirth: FutureDate);

    Assert.Throws<ValidationException>(() => _service.Save(info));
}

[Fact]
public void Save_ValidInfo_PersistsUser()
{
    var info = CreateUserInfo(dateOfBirth: PastDate);

    _service.Save(info);

    _repositoryMock.Verify(
        x => x.Save(It.Is<UserInfo>(saved => saved.Id == info.Id)),
        Times.Once);
}
```

### Khi nào cần kiểm thử class internal riêng

Chỉ cân nhắc khi class:

1. Được nhiều public API dùng lại và có contract ổn định.
2. Có logic đủ phức tạp để trở thành module độc lập.
3. Là adapter bọc third-party library.

Nếu cần mở visibility chỉ để viết test, hãy xem lại thiết kế trước.

### Tự do refactor

Public API có thể giữ nguyên trong khi validator được extract, inline hoặc thay implementation. Test theo hành vi không cần thay đổi theo các bước refactor đó.

### Hướng dẫn

- Dùng public method làm entry point, kể cả với edge case.
- Bao phủ private branch bằng input khác nhau cho public method.
- Không gọi private method bằng reflection.
- Không assertion state nội bộ nếu state đó không thuộc public contract.
