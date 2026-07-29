---
name: generate-tests
description: "Dùng khi người dùng yêu cầu tạo hoặc viết unit test cho mã C#. Skill phân tích target, lập danh sách test case để rà soát, sinh test bằng xUnit/Moq, rồi build và chạy test."
allowed-tools: Read, Write, Glob, Grep, Bash
---

# Skill tạo test

Phân tích mã nguồn và tạo unit test C# chất lượng cao cho đối tượng được chỉ định.

**Đối tượng cần kiểm thử:** $ARGUMENTS

## Tiêu chuẩn chất lượng

- Phân tích kỹ mã nguồn trước khi lập test case.
- Đọc đầy đủ file nguồn, dependency và rule liên quan.
- Không bỏ qua bước nào trong workflow.
- Không đoán constructor, property hoặc contract của test data; phải đọc type thực tế.
- Giữ framework và library hiện có của test project. Nếu dự án chưa có lựa chọn, dùng xUnit và Moq.

---

## Hướng dẫn

### Bước 1: Đọc rule và phân tích ngữ cảnh

1. Đọc rule liên quan trong `./rules/tests/`.
2. Đọc file, class hoặc method cần kiểm thử.
3. Theo namespace và reference để đọc DTO, entity, enum, custom exception cùng các type liên quan, theo `code-context-analysis.md`.
4. Tìm `{ClassName}Test` hoặc `{ClassName}Tests` trong test project, theo `existing-test-awareness.md`.
   - Nếu có, đọc toàn bộ và bổ sung test còn thiếu vào file đó.
   - Nếu chưa có, đọc 2 đến 3 test class lân cận để học quy ước dự án.
5. Đọc `.csproj`, `Directory.Packages.props` và global using liên quan để xác định xUnit, Moq, FluentAssertions, Shouldly hoặc library hiện có.

### Bước 2: Lập test case

Phân tích mọi nhánh mã:

- Luồng thành công.
- Luồng lỗi và exception.
- Validation.
- Nhánh private/protected được public API gọi tới.
- Authorization policy hoặc attribute bảo mật.
- Async, cancellation và nullable contract khi mã có xử lý rõ ràng.

Áp dụng nghiêm ngặt INCLUDE/EXCLUDE rule. Chưa sinh mã test ở bước này.

#### Định dạng test case

```
## Test case cho {ClassName}.{MethodName}

### 1. {TestMethodName}
- **Given:** {điều kiện trước/trạng thái input}
- **When:** {hành động được kiểm thử}
- **Then:** {kết quả kỳ vọng}
- **Code branch:** {nhánh mã được bao phủ}

### 2. {TestMethodName}
...
```

#### Quy ước đặt tên

Dùng `{TestedMethod}_{GivenState}_{ExpectedOutcome}` theo PascalCase.

Ví dụ:

- `CalculateTotal_ValidProducts_ReturnsSum`
- `CalculateTotal_EmptyList_ThrowsArgumentException`
- `GetUser_Unauthenticated_Returns401`
- `CreateOrder_CancellationRequested_ThrowsOperationCanceledException`

### Bước 3: Yêu cầu người dùng rà soát

Sau khi xuất danh sách test case, dùng cơ chế hỏi người dùng mà agent hiện tại hỗ trợ. Nếu không có tool tương tác chuyên dụng, đặt câu hỏi trong phản hồi và dừng để chờ câu trả lời:

```
Câu hỏi: "Danh sách test case đã sẵn sàng. Tiếp tục sinh mã test?"
Tiêu đề: "Bước tiếp theo"
Lựa chọn:
  - "Có, sinh test": tạo test file từ danh sách trên.
  - "Chưa, tôi muốn rà soát": dừng để người dùng chỉnh test case.
```

Nếu người dùng đồng ý, chuyển sang Bước 4. Nếu không, dừng và chờ hướng dẫn.

### Bước 4: Sinh mã test

1. Xác định loại mã và áp dụng rule phù hợp:
   - **ASP.NET Core controller/endpoint**: dùng `controller-test-rules.md`.
   - **Service/domain logic**: dùng `domain-service-rules.md`.
   - **Repository, messaging hoặc loại khác**: dùng `domain-service-rules.md` làm baseline và nói rõ chưa có rule chuyên biệt.
   - **Mọi mã C#**: luôn áp dụng `xunit-test-template.md`, `argument-matching.md`, `json-serialization.md` và `logging-rules.md` khi có liên quan.
2. Nếu đã có test class, thêm method vào class đó; không tạo file trùng.
3. Sinh test theo đúng test case ở Bước 2.
4. Dùng assertion và mocking library hiện có. Không thêm library thứ hai nếu chưa cần.
5. Tạo hoặc cập nhật test file.

### Bước 5: Build và chạy test

1. Chạy `dotnet build` cho test project và sửa compilation error, tối đa 5 lần. Xem `compilation-verification.md`.
2. Chạy test class vừa tạo bằng `dotnet test --filter`. Xem `test-execution-verification.md`.
3. Sửa test thất bại; không sửa production code chỉ để làm test pass.
4. Nếu gặp blocker sau các lần thử hợp lý, báo command, failure và nguyên nhân còn lại cho người dùng. Không âm thầm xóa test.

---

## Xử lý sự cố

### Không tìm thấy file cần kiểm thử

Thông báo đường dẫn chính xác đã tìm và yêu cầu người dùng làm rõ.

### Target không phải C#

Chỉ áp dụng general rule và thông báo rằng skill này được tối ưu cho C#/.NET; convention riêng của ngôn ngữ khác cần rà soát thủ công.

### Build vẫn thất bại

Sau 5 lần sửa:

1. Dừng và đưa ra compiler error còn lại.
2. Nêu nguyên nhân có thể có, như thiếu package hoặc version không tương thích.
3. Yêu cầu người dùng xử lý build blocker trước khi tiếp tục.

### Test thất bại do hành vi production code

1. Không sửa production code nếu người dùng chỉ yêu cầu tạo test.
2. Kiểm tra lại contract và expected value.
3. Nếu hành vi có dấu hiệu là bug, báo rõ thay vì làm test pass bằng expected value sai.

---

## Ví dụ workflow

```
Người dùng: "/generate-tests Services/OrderService.cs"

Bước 1: Agent đọc OrderService.cs, OrderRequest.cs, Order.cs,
        IOrderRepository.cs, test project và OrderServiceTests.cs nếu có.

Bước 2: Agent lập test case cho:
        - CreateOrder thành công
        - CreateOrder với request không hợp lệ
        - ProcessPayment thành công
        - ProcessPayment thất bại
        - CalculateTotal với danh sách product
        - CalculateTotal với danh sách rỗng
        - CancelOrder khi order không tồn tại

Bước 3: Agent yêu cầu người dùng rà soát.

Bước 4: Agent tạo hoặc cập nhật OrderServiceTests.cs bằng xUnit và Moq.

Bước 5: Agent chạy:
        dotnet build tests/MyApp.Tests/MyApp.Tests.csproj
        dotnet test tests/MyApp.Tests/MyApp.Tests.csproj --filter "FullyQualifiedName~OrderServiceTests"

Kết quả: test file compile và mọi test mục tiêu đều pass.
```

---

## Tham chiếu rule

Phải đọc và áp dụng các rule liên quan trong `./rules/tests/`.

> **Lưu ý bảo trì:** General rule trong `./rules/tests/general/` dùng chung với skill `generate-test-cases`, nơi có bản sao trong `rules/general/`. Khi cập nhật, phải đồng bộ cả hai vị trí.

### General rule

- `general/test-case-generation-strategy.md`: tiêu chí INCLUDE/EXCLUDE.
- `general/naming-conventions.md`: quy ước đặt tên test.
- `general/general-principles.md`: nguyên tắc kiểm thử cốt lõi.
- `general/technology-stack-detection.md`: nhận diện stack.
- `general/what-makes-good-test.md`: tính rõ ràng, đầy đủ, ngắn gọn và bền vững.
- `general/cleanly-create-test-data.md`: tạo test data bằng helper và builder.
- `general/keep-cause-effect-clear.md`: đặt nguyên nhân và kết quả gần nhau.
- `general/no-logic-in-tests.md`: tránh logic trong assertion.
- `general/keep-tests-focused.md`: mỗi test chỉ có một kịch bản.
- `general/test-behaviors-not-methods.md`: tách test theo hành vi.
- `general/verify-relevant-arguments-only.md`: chỉ xác minh mock argument liên quan.
- `general/prefer-public-apis.md`: kiểm thử qua public API.
- `general/existing-test-awareness.md`: tránh test trùng lặp.
- `general/code-context-analysis.md`: đọc dependency trước khi viết test.

### Unit test C# xUnit

- `csharp/unit/xunit-test-template.md`: template xUnit và annotation/fixture cần tránh.
- `csharp/unit/json-serialization.md`: dùng JSON literal rõ ràng.
- `csharp/unit/argument-matching.md`: dùng predicate hoặc callback thay cho matcher quá rộng.
- `csharp/unit/logging-rules.md`: xác minh `ILogger<T>` và console output.
- `csharp/unit/domain-service-rules.md`: pattern Moq cho service/domain.
- `csharp/unit/controller-test-rules.md`: pattern ASP.NET Core cho controller/endpoint.

### Hậu kiểm

- `post-generation/compilation-verification.md`: xác minh compilation.
- `post-generation/test-execution-verification.md`: xác minh test pass.
