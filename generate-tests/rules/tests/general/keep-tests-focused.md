---
title: Giữ test có trọng tâm
impact: HIGH
impactDescription: bảo đảm mỗi test xác minh một kịch bản cụ thể để failure message rõ ràng
tags: tests, focused, single-scenario, single-assertion
---

## Giữ test có trọng tâm

Mỗi test chỉ nên thực thi một kịch bản cụ thể. Nhiều kịch bản trong cùng một test sẽ khiến failure khó chẩn đoán.

### Vấn đề: Nhiều kịch bản trong một test

**Không đúng:**

```csharp
[Fact]
public void WithdrawFromAccount() {
    _account.Deposit(Usd(5));

    // Kịch bản 1: rút tiền trong phạm vi số dư
    Assert.Equal(Result.Ok, _account.Withdraw(Usd(5)));

    // Kịch bản 2: rút vượt số dư
    Assert.Equal(Result.Rejected, _account.Withdraw(Usd(1)));

    // Kịch bản 3: rút tiền bằng hạn mức thấu chi
    _account.SetOverdraftLimit(Usd(1));
    Assert.Equal(Result.Ok, _account.Withdraw(Usd(1)));
}
// Test này kiểm tra ba kịch bản thay vì một
```

**Đúng:**

```csharp
[Fact]
public void Withdraw_WithinBalance_Succeeds() {
    DepositAndSettle(Usd(5));

    Assert.Equal(Result.Ok, _account.Withdraw(Usd(5)));
}

 [Fact]
public void Withdraw_OverBalance_IsRejected() {
    DepositAndSettle(Usd(5));

    Assert.Equal(Result.Rejected, _account.Withdraw(Usd(6)));
}

 [Fact]
public void Withdraw_WithinOverdraftLimit_Succeeds() {
    DepositAndSettle(Usd(5));
    _account.SetOverdraftLimit(Usd(1));

    Assert.Equal(Result.Ok, _account.Withdraw(Usd(6)));
}
```

### Lợi ích của test có trọng tâm

1. **Failure message rõ ràng**: biết chính xác phần nào bị hỏng.
2. **Tên có tính mô tả**: mỗi tên test mô tả một kịch bản.
3. **Dễ bảo trì**: thay đổi một kịch bản không ảnh hưởng kịch bản khác.
4. **Dễ quan sát coverage**: thấy rõ kịch bản nào đã được kiểm thử.

### Khi nào có thể dùng nhiều assertion

Có thể dùng nhiều assertion khi xác minh **một hành vi** có nhiều property:

```csharp
[Fact]
public void CreateUser_ValidInput_ReturnsCompleteUser() {
    var actualUser = _userService.Create("john@test.com", "John");

    // Mọi assertion cùng xác minh hành vi tạo user
    Assert.NotNull(actualUser.Id);
    Assert.Equal("john@test.com", actualUser.Email);
    Assert.Equal("John", actualUser.Name);
    Assert.NotEqual(default, actualUser.CreatedAt);
}
```

### Dấu hiệu test thiếu trọng tâm

- Tên test dùng "and", ví dụ `TestDepositAndWithdraw`.
- Có nhiều phần "When" hoặc "Act".
- State thay đổi giữa các assertion.
- Khó đặt tên test ngắn gọn.
- Test dài hơn 10 đến 15 dòng.

### Tách test thiếu trọng tâm

Hãy hỏi: "Nếu test này thất bại, mình có biết chính xác kịch bản nào bị hỏng không?"

Nếu không, hãy tách thành nhiều test.
