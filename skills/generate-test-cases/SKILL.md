---
name: generate-test-cases
description: "Dùng khi người dùng muốn phân tích test coverage, liệt kê test case cần có hoặc rà soát chiến lược kiểm thử mà không sinh mã kiểm thử."
allowed-tools: Read, Glob, Grep
---

# Skill tạo test case

Phân tích mã nguồn và lập danh sách test case cần viết cho method hoặc class được chỉ định. Skill này chỉ tạo mô tả test case, không sinh mã kiểm thử.

**Đối tượng cần phân tích:** $ARGUMENTS

## Tiêu chuẩn chất lượng

- Phân tích kỹ mã nguồn trước khi liệt kê test case.
- Ưu tiên chất lượng hơn tốc độ; đọc kỹ các file mã nguồn và rule liên quan.
- Không bỏ qua class dependency. Hiểu đủ ngữ cảnh sẽ cho ra test case tốt hơn.
- Không dùng tỷ lệ test pass làm thước đo chất lượng. Xác định expected outcome từ contract và invariant trước khi đối chiếu implementation.

---

## Hướng dẫn

### Bước 1: Đọc quy tắc và phân tích ngữ cảnh

1. **Đọc quy tắc chung** trong thư mục `./rules/general/` (xem phần Tham chiếu quy tắc bên dưới).
2. **Đọc quy tắc C#** trong `./rules/csharp/xunit.md` khi target là file `.cs` hoặc dự án có `.csproj` hay `.sln`.
3. **Đọc đối tượng cần phân tích**: file nguồn, class hoặc method đã chỉ định.
4. **Đọc nguồn kỳ vọng độc lập**: acceptance criteria, API contract, validation, authorization policy, XML documentation, invariant và tài liệu dự án nếu có.
5. **Đọc dependency**: theo các import để đọc DTO, entity, enum và kiểu dữ liệu mà đối tượng sử dụng, theo quy tắc `code-context-analysis`.
6. **Kiểm tra test hiện có**: tìm theo tên class và reference tới constructor, fully-qualified type hoặc public method theo rule `existing-test-awareness`. Nếu có, đọc toàn bộ và chỉ tập trung vào hành vi chưa được bao phủ.

### Bước 2: Tạo test case

1. Dùng các nhánh mã để tìm hành vi quan sát được, gồm:
   - Luồng thành công
   - Luồng lỗi/exception
   - Logic validation
   - Method private/protected được đối tượng gọi
   - Annotation bảo mật, nếu có
2. Áp dụng nghiêm ngặt các quy tắc INCLUDE/EXCLUDE.
3. Áp dụng `contract-first-bug-discovery.md` để tách contract test khỏi characterization test và tìm các sai lệch có căn cứ.
4. Xuất danh sách test case theo đúng định dạng.
5. Không sinh mã kiểm thử, chỉ mô tả test case.

---

## Định dạng đầu ra

Với mỗi test case, cung cấp:

```
## Test case cho {ClassName}.{methodName}

### 1. {testMethodName}
- **Given:** {điều kiện trước/trạng thái input}
- **When:** {hành động được kiểm thử}
- **Then:** {kết quả kỳ vọng}
- **Code branch:** {nhánh mã được bao phủ}
- **Căn cứ kỳ vọng:** {đường dẫn:dòng, symbol/heading, phát biểu người dùng hoặc hành vi hiện tại đối với Characterization}
- **Rủi ro:** {lỗi mà test có thể phát hiện}
- **Loại:** {Contract/Regression/Characterization}

### 2. {testMethodName}
...
```

### Quy ước đặt tên
Tên test method có dạng: `{testedMethod}_{givenState}_{expectedOutcome}`

Ví dụ:
- `CalculateTotal_ValidProducts_ReturnsSum`
- `CalculateTotal_EmptyList_ThrowsArgumentException`
- `GetUser_Unauthorized_Returns401`
- `GetUser_Forbidden_Returns403`

---

## Xử lý sự cố

### Không tìm thấy file cần phân tích
Nếu đối tượng được chỉ định không tồn tại, thông báo đường dẫn chính xác đã tìm và yêu cầu người dùng làm rõ.

### Ngôn ngữ không được hỗ trợ
Nếu mã cần phân tích dùng ngôn ngữ chưa có rule riêng, chỉ áp dụng rule chung và thông báo cho người dùng.

### Mọi hành vi đã được bao phủ
Nếu test class hiện có đã bao phủ mọi hành vi được xác định, hãy xuất bản tóm tắt xác nhận coverage hoàn tất và liệt kê nội dung đã kiểm thử. Không tự thêm test case không cần thiết.

---

## Ví dụ

```
Người dùng yêu cầu: "/generate-test-cases src/MyApp/Services/OrderService.cs"

Bước 1: Agent đọc quy ước xUnit/C# và rule chung, đọc OrderService.cs,
        OrderRequest.cs cùng Order.cs (dependency), rồi kiểm tra OrderServiceTests.cs hiện có.

Bước 2: Agent xuất:

## Test case cho OrderService.CreateOrder

### 1. CreateOrder_ValidRequest_SavesAndReturnsOrder
- **Given:** OrderRequest hợp lệ, có productId "product-1" và quantity 5
- **When:** gọi `CreateOrder`
- **Then:** Order được lưu vào repository và trả về cùng ID đã sinh
- **Code branch:** Luồng thành công
- **Căn cứ kỳ vọng:** Contract của `IOrderService.CreateOrder`
- **Rủi ro:** Mapping sai product hoặc không lưu order
- **Loại:** Contract

### 2. CreateOrder_NullProductId_ThrowsArgumentException
- **Given:** OrderRequest có productId null
- **When:** gọi CreateOrder
- **Then:** throw `ArgumentException`
- **Code branch:** Validation kiểm tra productId null
- **Căn cứ kỳ vọng:** Guard clause của public API và nullable contract
- **Rủi ro:** Input không hợp lệ vẫn được lưu
- **Loại:** Contract
...
```

---

## Tham chiếu rule

**QUAN TRỌNG: Phải đọc và áp dụng mọi rule trong các file sau trước khi tạo test case:**

> **Lưu ý bảo trì:** Rule chung trong `./rules/general/` được dùng chung với skill `generate-tests`, nơi có bản sao tại `rules/tests/general/`. Khi cập nhật rule, phải đồng bộ cả hai vị trí.

### Rule chung (luôn áp dụng)
- `./rules/general/test-case-generation-strategy.md`: tiêu chí INCLUDE/EXCLUDE cho test case.
- `./rules/general/naming-conventions.md`: định dạng đặt tên test.
- `./rules/general/general-principles.md`: nguyên tắc kiểm thử cốt lõi.
- `./rules/general/what-makes-good-test.md`: tính rõ ràng, đầy đủ, ngắn gọn và bền vững.
- `./rules/general/keep-tests-focused.md`: mỗi test chỉ có một kịch bản.
- `./rules/general/test-behaviors-not-methods.md`: tách test theo hành vi.
- `./rules/general/prefer-public-apis.md`: ưu tiên kiểm thử public API thay vì private method.
- `./rules/general/cleanly-create-test-data.md`: dùng helper và builder cho test data.
- `./rules/general/keep-cause-effect-clear.md`: đặt kết quả ngay sau nguyên nhân.
- `./rules/general/no-logic-in-tests.md`: ưu tiên KISS hơn DRY, tránh logic trong assertion.
- `./rules/general/technology-stack-detection.md`: nhận diện ngôn ngữ và framework.
- `./rules/general/verify-relevant-arguments-only.md`: chỉ xác minh argument mock liên quan.
- `./rules/general/existing-test-awareness.md`: kiểm tra test hiện có và tránh trùng lặp.
- `./rules/general/code-context-analysis.md`: đọc dependency trước khi phân tích.
- `./rules/general/contract-first-bug-discovery.md`: chọn nguồn expected độc lập, phân loại test và giữ regression test có căn cứ.

### Rule C# xUnit

- `./rules/csharp/xunit.md`: nullable contract, async, cancellation, HTTP status và quy ước xUnit/Moq của dự án.
