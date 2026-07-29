---
title: Phân tích ngữ cảnh mã nguồn
impact: HIGH
impactDescription: bảo đảm test data chính xác bằng cách hiểu đầy đủ dependency graph
tags: tests, context, dependencies, dto, entity, analysis
---

## Phân tích ngữ cảnh mã nguồn

Trước khi tạo test, hãy đọc mọi kiểu dữ liệu mà mã cần phân tích tham chiếu. Test dùng sai constructor, thiếu field bắt buộc hoặc tạo object không hợp lệ sẽ không compile hoặc cho kết quả vô nghĩa.

### Nội dung cần đọc trước khi viết test

Sau khi đọc class cần phân tích, hãy xác định và đọc:

1. **Kiểu parameter trực tiếp**: mọi class được dùng làm parameter của method.
2. **Kiểu trả về**: mọi class được method đang kiểm thử trả về.
3. **Kiểu field được inject qua constructor**: dependency cần mock.
4. **Domain entity / DTO**: class được tạo hoặc biến đổi trong thân method.
5. **Enum**: enum dùng trong điều kiện, `switch` hoặc parameter.
6. **Custom exception**: class exception mà method throw.
7. **Validator / constraint**: custom annotation class nếu có kiểm thử validation.

### Vì sao cần đọc dependency

**Khi chưa đọc dependency:**
```csharp
// Compile được nhưng THẤT BẠI vì argument của constructor không đúng
var request = new OrderRequest("product-1", 5);
// Constructor thực tế: OrderRequest(string productId, int quantity, string customerId)
```

**Khi đã đọc dependency:**
```csharp
// Đúng, khớp với constructor thực tế
var request = new OrderRequest("product-1", 5, "customer-123");
```

### Cách đọc dependency hiệu quả

1. Đọc import của class cần phân tích để xác định các kiểu được tham chiếu.
2. Dùng Glob để tìm file nguồn: `**/OrderRequest.cs`.
3. Đọc từng dependency để hiểu:
   - Parameter của constructor, gồm kiểu và thứ tự.
   - Field bắt buộc và field tùy chọn.
   - Builder pattern; nếu có thì dùng builder.
   - Factory method; nếu có thì ưu tiên hơn constructor.
   - Các giá trị enum khả dụng.

### Nội dung cần đặc biệt chú ý

- **C# nullability và guard**: `string?`, `required`, data annotation và `ArgumentNullException.ThrowIfNull` cho biết constraint cần thỏa mãn hoặc cố ý vi phạm trong negative test.
- **Record, constructor, builder và factory method**: đọc parameter và giá trị mặc định thực tế trước khi đề xuất test data.
- **Inheritance**: nếu class kế thừa class khác, hãy đọc cả parent class.
- **Generic**: hiểu type parameter để dùng đúng kiểu trong test.

### Checklist

Trước khi viết bất kỳ test method nào:
- [ ] Đã đọc mọi kiểu parameter mà method cần phân tích sử dụng.
- [ ] Đã đọc mọi kiểu trả về.
- [ ] Đã đọc domain entity được tạo hoặc sửa trong thân method.
- [ ] Đã đọc enum class dùng trong điều kiện.
- [ ] Đã xác định constructor, builder hoặc factory method để tạo test data.
