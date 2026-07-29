---
title: Quy ước đặt tên test
impact: HIGH
impactDescription: bảo đảm tên test nhất quán, dễ đọc và mô tả đúng hành vi
tags: tests, naming, conventions, readability
---

## Quy ước đặt tên test

Dùng mẫu đặt tên nhất quán, mô tả rõ kịch bản kiểm thử và kết quả kỳ vọng.

### Đặt tên test class

Theo quy ước C# / xUnit:
- Đặt `[TestedClass]Tests.cs` trong project `<Project>.Tests` tương ứng.
- Đặt `Method_GivenState_ExpectedOutcome` theo PascalCase.

### Đặt tên test method

Định dạng: `{testedMethod}_{givenState}_{expectedOutcome}`

**Không đúng:**

```csharp
// Quá mơ hồ
[Fact]
public void TestCalculate() { }

// Không mô tả kết quả
[Fact]
public void CalculateTotal_ValidProducts() { }

// Mô tả chi tiết triển khai thay vì hành vi
[Fact]
public void CalculateTotal_UsesLinq_ReturnsSum() { }
```

**Đúng:**

```csharp
// Trạng thái và kết quả rõ ràng
[Fact]
public void CalculateTotal_ValidProducts_ReturnsSum() { }

[Fact]
public void CalculateTotal_EmptyList_ThrowsArgumentException() { }

[Fact]
public void GetUser_Unauthorized_Returns401() { }

[Fact]
public void GetUser_Forbidden_Returns403() { }

[Fact]
public void SaveOrder_ValidOrder_PersistsToDatabase() { }

[Fact]
public void DeleteUser_NonExistentId_ThrowsNotFoundException() { }
```

### Hướng dẫn đặt tên

1. **Nêu cụ thể trạng thái/điều kiện**: dùng "validProducts" thay vì "goodInput".
2. **Nêu cụ thể kết quả**: dùng "returns401" thay vì "fails".
3. **Dùng ngôn ngữ domain**: dùng "unauthorized" thay vì "noToken".
4. **Tránh jargon không cần thiết**: mô tả hành vi, không mô tả cách triển khai.
