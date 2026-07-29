---
title: Kiểm thử hành vi, không kiểm thử method
impact: HIGH
impactDescription: tạo test có trọng tâm và bền vững trước refactoring
tags: tests, behaviors, resilient, maintainable
---

## Kiểm thử hành vi, không kiểm thử method

Tổ chức test theo kết quả quan sát được của hệ thống. Một public method có thể tạo nhiều hành vi, và mỗi hành vi cần một test riêng.

### Không gộp nhiều hành vi

**Không đúng:**

```csharp
[Fact]
public void ResetPassword_Works()
{
    var user = new User { Password = "1234" };

    _service.ResetPassword(user);

    Assert.Empty(user.Password);
    Assert.Equal("Password reset", user.Mailbox.Messages[0].Title);
    Assert.Equal(1, _counter.Get("reset-password"));
}
```

**Đúng:**

```csharp
[Fact]
public void ResetPassword_ExistingPassword_ClearsPassword()
{
    var user = new User { Password = "1234" };

    _service.ResetPassword(user);

    Assert.Empty(user.Password);
}

[Fact]
public void ResetPassword_ValidUser_SendsNotificationEmail()
{
    var user = new User
    {
        Password = "1234",
        Email = "john@test.com"
    };

    _service.ResetPassword(user);

    var actualEmail = Assert.Single(user.Mailbox.Messages);
    Assert.Equal("john@test.com", actualEmail.To);
    Assert.Equal("Password reset", actualEmail.Title);
}

[Fact]
public void ResetPassword_ValidUser_IncrementsResetCounter()
{
    var user = new User { Password = "1234" };

    _service.ResetPassword(user);

    Assert.Equal(1, _counter.Get("reset-password"));
}
```

### Xác định hành vi

Hãy hỏi: "Hành động này tạo ra kết quả nào có thể quan sát được?"

Với `ResetPassword()`:

- Password trở thành rỗng.
- User nhận email.
- Reset counter tăng lên.

Mỗi kết quả là một hành vi riêng.

### Một hành vi có thể có nhiều assertion

Có thể dùng nhiều assertion nếu chúng cùng mô tả một output, chẳng hạn các field của email:

```csharp
var actualEmail = Assert.Single(user.Mailbox.Messages);

Assert.Equal("john@test.com", actualEmail.To);
Assert.Equal("Password reset", actualEmail.Title);
Assert.StartsWith("You requested", actualEmail.Body);
```

### Đặt tên theo hành vi

- `ResetPassword_ExistingPassword_ClearsPassword`: mô tả trạng thái và kết quả.
- `TestResetPassword`: chỉ lặp lại tên method, không mô tả hành vi.
