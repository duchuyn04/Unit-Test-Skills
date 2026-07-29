---
title: Chiến lược tạo test case
impact: HIGH
impactDescription: bảo đảm độ bao phủ đầy đủ mà không tạo test trùng lặp
tags: tests, test-cases, strategy, coverage, branches
---

## Chiến lược tạo test case

Áp dụng nghiêm ngặt tiêu chí INCLUDE/EXCLUDE để tạo test case có ý nghĩa, bao phủ mọi nhánh mã mà không trùng lặp.

### INCLUDE:
- Mỗi nhánh mã và kết quả riêng biệt, gồm luồng thành công và xử lý lỗi.
- Mỗi giá trị trả về hoặc exception riêng mà method có thể tạo ra.
- Với HTTP method: tách riêng status 400, 401 và 403, không gộp chúng.
- Chỉ dùng status code cụ thể.
- **Validation constraint**: tạo test case NEGATIVE cho từng validation annotation, dùng input không hợp lệ phải bị validation từ chối.
- **Custom validator**: tạo test case kích hoạt validation failure.

### EXCLUDE:
- Kịch bản trùng nhau và có cùng kết quả quan sát được.
- Biến thể kích thước collection, trừ khi mã có logic phụ thuộc rõ ràng vào kích thước.
- Trường hợp suy đoán như Unicode hiếm hoặc payload rất lớn, trừ khi mã xử lý rõ ràng các trường hợp đó.
- Đối số null, trừ khi parameter là nullable (`T?`) hoặc mã có guard rõ ràng.
- Test trùng cùng nhánh mã, cùng nguyên nhân và cùng kết quả quan sát được, kể cả khi chúng ném cùng exception type.

Không gộp chỉ vì các nhánh ném cùng exception type. Hai validation branch cùng ném `ArgumentException` vẫn cần test riêng nếu chúng đại diện cho điều kiện hoặc contract khác nhau.

**Không đúng:**

```csharp
// Gộp các HTTP status code khác nhau
[Fact]
public void GetUser_InvalidRequest_Returns4xx() { }

// Kiểm thử kích thước collection khi không có logic riêng
// Ba trường hợp trùng lặp có cùng kết quả quan sát được

// Kiểm thử null khi input không nullable và không có guard rõ ràng
[Fact]
public void Calculate_NullInput_ThrowsException() { }
```

**Đúng:**

```csharp
// Tách test cho từng HTTP status
[Fact] public void GetUser_InvalidInput_Returns400() { }
[Fact] public void GetUser_Unauthenticated_Returns401() { }
[Fact] public void GetUser_Forbidden_Returns403() { }

// Một test cho việc xử lý collection vì không có logic phụ thuộc kích thước
[Fact] public void ProcessItems_ValidList_ReturnsProcessedResult() { }

// Chỉ kiểm thử null khi parameter nullable hoặc mã có guard
[Fact] public void Calculate_NullableInput_ReturnsDefault() { }
```

### QUAN TRỌNG: Method private/protected

Khi method gọi method private/protected, phải bao phủ gián tiếp mọi luồng thực thi bằng các input khác nhau truyền vào public method.

### Cách quyết định

Trước khi thêm test case, hãy hỏi:
1. Test có kích hoạt một nhánh mã KHÁC không? Nếu không, bỏ qua.
2. Test có tạo ra kết quả quan sát được KHÁC không? Nếu không, bỏ qua.
3. Mã có kiểm tra RÕ RÀNG điều kiện này không? Nếu không, bỏ qua.

**CẤM:** Dùng "2xx", "4xx", "5xx" thay cho status code cụ thể như 200, 400, 401, 403 và 500.
