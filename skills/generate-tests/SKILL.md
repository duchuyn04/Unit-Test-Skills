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
- Không tối ưu để mọi test pass. Lấy contract và invariant làm chuẩn; implementation chỉ là một nguồn để tìm branch và hành vi hiện tại.
- Khi yêu cầu chỉ là sinh test, coi toàn bộ production code là chỉ đọc. Việc test khó hoặc fail không cấp quyền sửa production code.

---

## Hướng dẫn

### Bước 1: Đọc rule và phân tích ngữ cảnh

1. Đọc rule liên quan trong `./rules/tests/`, luôn gồm `safety/production-code-write-boundary.md`.
2. Đọc file, class hoặc method cần kiểm thử.
3. Đọc acceptance criteria, API contract, validation, authorization policy, XML documentation, invariant và tài liệu dự án nếu có để xác định expected outcome độc lập với implementation.
4. Theo namespace và reference để đọc DTO, entity, enum, custom exception cùng các type liên quan, theo `code-context-analysis.md`.
5. Tìm `{ClassName}Test`, `{ClassName}Tests` và các test reference tới constructor, fully-qualified type hoặc public method của target, theo `existing-test-awareness.md`.
   - Nếu có, đọc toàn bộ và bổ sung test còn thiếu vào file đó.
   - Nếu chưa có, đọc 2 đến 3 test class lân cận để học quy ước dự án.
6. Đọc `.csproj`, `Directory.Packages.props` và global using liên quan để xác định xUnit, Moq, FluentAssertions, Shouldly hoặc library hiện có.
7. Xác định chính xác test project và thư mục test được phép ghi. Nêu allowed write set trong danh sách test case để người dùng biết phạm vi trước khi xác nhận.

### Bước 2: Lập test case

Dùng các nhánh mã để tìm hành vi quan sát được:

- Luồng thành công.
- Luồng lỗi và exception.
- Validation.
- Nhánh private/protected được public API gọi tới.
- Authorization policy hoặc attribute bảo mật.
- Async, cancellation và nullable contract khi mã có xử lý rõ ràng.

Áp dụng nghiêm ngặt INCLUDE/EXCLUDE rule và `contract-first-bug-discovery.md`. Chưa sinh mã test ở bước này.

#### Định dạng test case

```
## Test case cho {ClassName}.{MethodName}

### 1. {TestMethodName}
- **Given:** {điều kiện trước/trạng thái input}
- **When:** {hành động được kiểm thử}
- **Then:** {kết quả kỳ vọng}
- **Code branch:** {nhánh mã được bao phủ}
- **Căn cứ kỳ vọng:** {đường dẫn:dòng, symbol/heading, phát biểu người dùng hoặc hành vi hiện tại đối với Characterization}
- **Rủi ro:** {lỗi mà test có thể phát hiện}
- **Loại:** {Contract/Regression/Characterization}

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

Nếu người dùng đồng ý, chuyển sang Bước 4. Sự đồng ý sinh test chỉ áp dụng cho file mã kiểm thử trong allowed write set; không bao gồm production code, project file hoặc package/config. Nếu không, dừng và chờ hướng dẫn.

### Bước 4: Sinh mã test

1. Trước khi ghi, chạy toàn bộ test project để lấy baseline. Ghi command, số test pass/fail/skip và danh sách failure có sẵn. Nếu baseline không chạy được, dừng và báo blocker; chỉ tiếp tục không có baseline khi người dùng chấp nhận rõ ràng rằng không thể phát hiện regression mới.
2. Ngay trước lần ghi đầu tiên, resolve script từ thư mục chứa `SKILL.md`, rồi chạy chế độ `snapshot` của `scripts/production-write-boundary.mjs`; không giả định skill nằm trong repository đang được test. Truyền test project qua `--test-root` và lưu state ngoài repository.
3. Xác định loại mã và áp dụng rule phù hợp:
   - **ASP.NET Core controller/endpoint**: dùng `controller-test-rules.md`.
   - **Service/domain logic**: dùng `domain-service-rules.md`.
   - **Repository, messaging hoặc loại khác**: dùng `domain-service-rules.md` làm baseline và nói rõ chưa có rule chuyên biệt.
   - **Mọi mã C#**: luôn áp dụng `xunit-test-template.md`, `argument-matching.md`, `json-serialization.md` và `logging-rules.md` khi có liên quan.
4. Nếu đã có test class, thêm method vào class đó; không tạo file trùng.
5. Sinh test theo đúng test case ở Bước 2.
6. Dùng assertion và mocking library hiện có. Không thêm library thứ hai nếu chưa cần.
7. Chỉ tạo hoặc cập nhật file test trong allowed write set. Muốn đổi test project file, package hoặc config phải xin phép riêng và truyền đúng file được duyệt qua `--allow-config` khi tạo snapshot.
8. Nếu cần sửa production để tạo seam hoặc làm test pass, không sửa file. Dừng phần bị chặn và trả về `TESTABILITY_BLOCKER` theo safety rule.

### Bước 5: Build và chạy test

1. Chạy `dotnet build` cho test project và sửa compilation error, tối đa 5 lần. Xem `compilation-verification.md`.
2. Chạy test class vừa tạo bằng `dotnet test --filter` để chẩn đoán nhanh. Xem `test-execution-verification.md`.
3. Sửa test thất bại khi setup, mock hoặc expected outcome sai. Nếu production code vi phạm contract có căn cứ, giữ regression test fail và báo bug; không đổi expected chỉ để test pass.
4. Chạy lại toàn bộ test project và so sánh với baseline. Không bàn giao như đã xác minh đầy đủ nếu bỏ qua bước này. Chỉ chấp nhận failure mới khi đó là regression test có căn cứ đã báo rõ; không chấp nhận failure mới không giải thích được ở test khác.
5. Nếu gặp blocker hoặc nghi vấn production bug, báo command, expected, actual, căn cứ kỳ vọng và nguyên nhân còn lại. Không âm thầm xóa test.
6. Áp dụng `test-effectiveness-verification.md`: dùng coverage/mutation tooling sẵn có hoặc báo `EFFECTIVENESS_NOT_MEASURED`; không tự thêm package.
7. Chạy chế độ `check` của script đã resolve ở Bước 4 với state tương ứng. Nếu có `WRITE_BOUNDARY_VIOLATION`, dừng, báo đúng đường dẫn và không tự động revert thay đổi chưa rõ chủ sở hữu.

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
2. Kiểm tra lại contract, nguồn kỳ vọng, setup và test data.
3. Nếu production code vi phạm contract, giữ test tái hiện ở trạng thái fail và báo rõ thay vì làm test pass bằng expected value sai.
4. Nếu chưa có nguồn kỳ vọng độc lập, đánh dấu Characterization và hỏi người dùng; không tự kết luận bug.

### Test cần thay đổi production code để có thể kiểm thử

1. Không đổi visibility, constructor, interface, static dependency, clock, I/O wrapper hoặc dependency injection chỉ vì test đang khó viết.
2. Dừng test case bị chặn và trả về `TESTABILITY_BLOCKER`, gồm target, test bị chặn, lý do, refactor tối thiểu đề xuất và danh sách production file có thể bị ảnh hưởng.
3. Hỏi quyền sửa production bằng một xác nhận riêng. Xác nhận "sinh test" trước đó không được dùng làm quyền sửa production.
4. Trong khi chưa được phép, tiếp tục các test case độc lập khác nếu có thể và giữ production code nguyên trạng.

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
        dotnet test tests/MyApp.Tests/MyApp.Tests.csproj
        dotnet build tests/MyApp.Tests/MyApp.Tests.csproj
        dotnet test tests/MyApp.Tests/MyApp.Tests.csproj --filter "FullyQualifiedName~OrderServiceTests"
        dotnet test tests/MyApp.Tests/MyApp.Tests.csproj --no-build

Kết quả: test file compile; full project không có regression mới ngoài regression test có căn cứ; effectiveness được đo bằng tooling sẵn có hoặc báo `EFFECTIVENESS_NOT_MEASURED`.
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
- `general/contract-first-bug-discovery.md`: xác định nguồn expected độc lập, tìm lỗi có chủ đích và xử lý regression test fail.

### Unit test C# xUnit

- `csharp/unit/xunit-test-template.md`: template xUnit và annotation/fixture cần tránh.
- `csharp/unit/json-serialization.md`: dùng JSON literal rõ ràng.
- `csharp/unit/argument-matching.md`: dùng predicate hoặc callback thay cho matcher quá rộng.
- `csharp/unit/logging-rules.md`: xác minh `ILogger<T>` và console output.
- `csharp/unit/domain-service-rules.md`: pattern Moq cho service/domain.
- `csharp/unit/controller-test-rules.md`: pattern ASP.NET Core cho controller/endpoint.

### Hậu kiểm

- `post-generation/compilation-verification.md`: xác minh compilation.
- `post-generation/test-execution-verification.md`: phân loại test defect, production defect và regression test fail.
- `post-generation/test-effectiveness-verification.md`: xác minh coverage/mutation khi repository có tooling và báo rõ khi chưa đo effectiveness.

### An toàn thay đổi

- `safety/production-code-write-boundary.md`: giới hạn file agent được ghi, cơ chế `TESTABILITY_BLOCKER` và cách xử lý vi phạm.
- `scripts/production-write-boundary.mjs`: chụp baseline và phát hiện thay đổi ngoài test project hoặc config chưa được duyệt.
