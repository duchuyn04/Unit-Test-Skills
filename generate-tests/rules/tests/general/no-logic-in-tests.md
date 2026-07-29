---
title: Không đưa logic vào test
impact: HIGH
impactDescription: tránh lỗi trong test và làm rõ expected value
tags: tests, simplicity, kiss, no-logic, readability
---

## Không đưa logic vào test

Test phải thẳng thắn, không có điều kiện, vòng lặp hoặc phép tính dùng để tạo expected value.

### KISS > DRY

Trong test, sự đơn giản quan trọng hơn việc loại bỏ mọi lặp lại.

### Logic có thể che giấu lỗi

**Không đúng:**

```csharp
[Fact]
public void GetPhotosPageUrl_ReturnsUrl()
{
    const string baseUrl = "http://photos.google.com/";
    var builder = new UrlBuilder(baseUrl);

    var actualUrl = builder.GetPhotosPageUrl();

    Assert.Equal(baseUrl + "/u/0/photos", actualUrl);
}
```

**Đúng:**

```csharp
[Fact]
public void GetPhotosPageUrl_ValidBaseUrl_ReturnsPhotosUrl()
{
    var builder = new UrlBuilder("http://photos.google.com/");

    var actualUrl = builder.GetPhotosPageUrl();

    Assert.Equal("http://photos.google.com/u/0/photos", actualUrl);
}
```

### Pattern cần tránh

**Không đúng:**

```csharp
for (var index = 0; index < users.Count; index++)
{
    Assert.True(users[index].IsActive);
}

if (response.IsSuccessful)
{
    Assert.NotNull(response.Body);
}

Assert.Equal("Hello, " + userName + "!", result);
Assert.Equal(price * quantity + tax, total);
```

**Đúng:**

```csharp
Assert.All(users, user => Assert.True(user.IsActive));

Assert.True(response.IsSuccessful);
Assert.NotNull(response.Body);

Assert.Equal("Hello, John!", result);

const decimal expectedTotal = 115m;
Assert.Equal(expectedTotal, total);
```

### Khi cần logic phức tạp

Chuyển logic dùng chung sang test data builder hoặc custom assertion có test riêng. Không sao chép production algorithm vào test để tính expected value.

### Nguyên tắc

1. Dùng literal hoặc constant đã tính trước cho expected value.
2. Không dùng control flow để quyết định có assertion hay không.
3. Mỗi test bao phủ một kịch bản cụ thể.
4. Chấp nhận lặp lại khi nó làm test dễ đọc hơn.
