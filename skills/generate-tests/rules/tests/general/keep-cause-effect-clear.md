---
title: Làm rõ nguyên nhân và kết quả
impact: HIGH
impactDescription: bảo đảm test độc lập và dễ hiểu
tags: tests, readability, cause-effect, self-contained
---

## Làm rõ nguyên nhân và kết quả

Viết test sao cho kết quả xuất hiện ngay sau nguyên nhân. Tránh phụ thuộc vào setup code ở xa.

### Vấn đề: Setup bị ẩn

Khi setup nằm xa test, người đọc phải cuộn sang nơi khác mới hiểu được test.

**Không đúng:**

```csharp
private readonly Counter _counter = new();

public KeepCauseAndEffectClearTests() {
    counter.increment("key1", 8);
    counter.increment("key2", 100);
    counter.increment("key1", 0);
    counter.increment("key1", 1);
}

// ... 200 dòng sau ...

 [Fact]
public void Increment_ExistingKey_AddsToValue() {
    // Không rõ số 9 đến từ đâu, phải cuộn lên mới tìm thấy
    Assert.Equal(9, _counter.Get("key1"));
}
```

**Đúng:**

```csharp
private readonly Counter _counter = new();

[Fact]
public void Increment_NewKey_SetsValue() {
    // Nguyên nhân và kết quả nằm cạnh nhau
    _counter.Increment("key2", 100);

    Assert.Equal(100, _counter.Get("key2"));
}

 [Fact]
public void Increment_ExistingKey_AddsToValue() {
    // Quan hệ nguyên nhân-kết quả rõ ràng
    _counter.Increment("key1", 8);
    _counter.Increment("key1", 1);

    Assert.Equal(9, _counter.Get("key1"));
}
```

### Hướng dẫn

1. **Đặt setup trong test** nếu setup đó cần thiết để hiểu test.
2. **Chỉ dùng constructor của test class** để setup hạ tầng như mock hoặc container, không dùng cho dữ liệu riêng của test.
3. **Tránh shared mutable state**: mỗi test tự setup dữ liệu của mình.
4. **Giữ test độc lập**: người đọc không cần xem nơi khác.

### Khi nào nên dùng constructor của test class

Dùng constructor của test class cho hạ tầng, không dùng cho test data:

```csharp
public UserServiceTests() {
    // Hợp lý: setup hạ tầng
    _mockServer = new MockServer();

    // Hợp lý: tạo SUT
    _service = new UserService(_mockServer.BaseAddress);
}

 [Fact]
public void GetUser_ExistingUser_ReturnsUser() {
    // Dữ liệu riêng của test phải nằm trong test
    _mockServer.Enqueue("{\"name\":\"John\"}");

    var actualUser = _service.GetUser("123");

    Assert.Equal("John", actualUser.Name);
}
```

### Lợi ích

- Test có tính **self-documenting**: chỉ cần đọc test là hiểu.
- Test **độc lập**: thay đổi một test không làm hỏng test khác.
- Failure **dễ debug hơn**: mọi ngữ cảnh liên quan đều hiển thị tại chỗ.
