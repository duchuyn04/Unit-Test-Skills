# Unit Test Skills cho C# và xUnit

Bộ skill này giúp AI coding agent phân tích và viết unit test cho dự án C#/.NET. Các quy tắc đi kèm tập trung vào xUnit, Moq, ASP.NET Core và quy trình kiểm tra lại bằng `dotnet build` cùng `dotnet test`.

Repository có hai skill:

| Skill | Dùng khi nào |
| --- | --- |
| `generate-test-cases` | Phân tích mã nguồn và liệt kê test case cần có, không tạo mã test. |
| `generate-tests` | Phân tích mã nguồn, lập test case để bạn rà soát, viết mã test, sau đó build và chạy test. |

## Yêu cầu

Máy cần có:

- [Node.js](https://nodejs.org/) và npm để chạy `npx`.
- Một AI coding agent hỗ trợ Agent Skills, chẳng hạn Codex.
- [.NET SDK](https://dotnet.microsoft.com/download) tương thích với dự án cần kiểm thử.
- Dự án C# có test project, hoặc có cấu trúc đủ rõ để agent xác định nơi đặt test.

Kiểm tra nhanh môi trường:

```bash
node --version
npx --version
dotnet --version
```

## Cài đặt bằng npx

### Bước 1: Mở terminal tại dự án C#

Di chuyển đến thư mục gốc của solution hoặc repository mà bạn muốn viết test:

```bash
cd path/to/your-dotnet-project
```

### Bước 2: Xem danh sách skill

Lệnh sau hiển thị các skill có thể cài:

```bash
npx skills@latest add duchuyn04/Unit-Test-Skills --list
```

Kết quả cần có `generate-test-cases` và `generate-tests`.

### Bước 3: Cài cho project hiện tại

Đây là cách phù hợp khi bạn muốn các skill đi cùng một dự án cụ thể:

```bash
npx skills@latest add duchuyn04/Unit-Test-Skills -a codex --skill '*' -y
```

Không có cờ `-g`, vì vậy skill được cài ở phạm vi project. Nếu chỉ cần một skill, dùng một trong hai lệnh:

```bash
npx skills@latest add duchuyn04/Unit-Test-Skills -a codex --skill generate-test-cases -y
npx skills@latest add duchuyn04/Unit-Test-Skills -a codex --skill generate-tests -y
```

### Bước 4: Cài toàn cục nếu cần

Cài toàn cục để dùng các skill trong nhiều dự án trên cùng máy:

```bash
npx skills@latest add duchuyn04/Unit-Test-Skills -g -a codex --skill '*' -y
```

Nên cài theo project nếu mỗi repository có quy ước test riêng. Dùng `-g` khi bạn muốn bộ quy tắc này là mặc định cho các dự án C# của mình.

### Bước 5: Kiểm tra sau khi cài

```bash
npx skills list -a codex
```

Nếu vừa cài trong lúc agent đang mở, hãy bắt đầu một task mới hoặc khởi động lại phiên làm việc để agent nạp danh sách skill mới.

## Cách sử dụng

### Chỉ phân tích và lập test case

Trong Codex, gọi `generate-test-cases` kèm đường dẫn file, class hoặc method cần phân tích:

```text
$generate-test-cases src/MyApp/Services/OrderService.cs
```

Bạn cũng có thể viết yêu cầu tự nhiên và nhắc rõ tên skill:

```text
Dùng generate-test-cases để phân tích các test case còn thiếu cho
src/MyApp/Services/OrderService.cs. Chưa viết mã test.
```

Skill sẽ:

1. Đọc mã nguồn của đối tượng cần kiểm thử.
2. Đọc DTO, entity, enum, interface và dependency liên quan.
3. Tìm test class hiện có để tránh tạo test case trùng.
4. Phân tích luồng thành công, validation, exception, authorization, async và cancellation khi có liên quan.
5. Trả về danh sách test case theo Given – When – Then, không sửa hoặc tạo file test.

Ví dụ đầu ra rút gọn:

```markdown
## Test case cho OrderService.CreateOrder

### 1. CreateOrder_ValidRequest_SavesAndReturnsOrder
- **Given:** Request hợp lệ và repository chưa có order trùng.
- **When:** Gọi CreateOrder.
- **Then:** Order được lưu và trả về với ID đã sinh.
- **Code branch:** Luồng thành công.
```

### Phân tích và viết unit test

Gọi `generate-tests` khi bạn muốn agent thực hiện toàn bộ quy trình:

```text
$generate-tests src/MyApp/Services/OrderService.cs
```

Hoặc dùng câu lệnh tự nhiên:

```text
Dùng generate-tests để viết unit test xUnit cho
src/MyApp/Services/OrderService.cs.
```

Quy trình gồm năm bước:

1. Agent đọc target, dependency, test project, `.csproj`, global using và các test lân cận.
2. Agent lập danh sách test case cho từng hành vi và nhánh mã cần thiết.
3. Agent dừng lại để bạn rà soát danh sách test case.
4. Sau khi được xác nhận, agent tạo mới hoặc cập nhật test class bằng framework và thư viện hiện có của dự án.
5. Agent chạy `dotnet build`, sau đó chạy đúng nhóm test vừa tạo bằng `dotnet test --filter`.

Ở bước rà soát, bạn có thể chỉnh danh sách trước khi cho phép sinh mã. Ví dụ:

```text
Bỏ test case kiểm tra null vì contract không cho phép null.
Thêm trường hợp CancellationToken đã bị hủy, sau đó tiếp tục sinh test.
```

## Phạm vi hỗ trợ

Các rule hiện có bao gồm:

- C# và xUnit.
- Moq cho dependency và argument matching.
- Service và domain logic.
- ASP.NET Core controller hoặc endpoint.
- Kiểm tra `ILogger<T>` khi log là hành vi cần xác minh.
- JSON serialization trong test.
- Async, exception, validation và cancellation.
- Build test project và chạy test theo filter sau khi sinh mã.

Skill ưu tiên assertion library và mocking library đang có trong test project. Nếu dự án dùng FluentAssertions, Shouldly hoặc thư viện khác, agent sẽ giữ quy ước đó thay vì tự ý thêm thư viện mới. Khi dự án chưa có lựa chọn rõ ràng, skill dùng xUnit và Moq.

## Nguyên tắc viết test

- Tên test theo dạng `{TestedMethod}_{GivenState}_{ExpectedOutcome}`.
- Mỗi test tập trung vào một hành vi hoặc một kết quả quan sát được.
- Kiểm thử qua public API thay vì gọi trực tiếp private method.
- Không thêm test chỉ để thay đổi số lượng phần tử nếu hành vi không đổi.
- Không đoán constructor, property hoặc contract của DTO; agent phải đọc type thực tế.
- Tránh logic phức tạp trong phần arrange và assertion.
- Chỉ verify những argument có ý nghĩa với hành vi đang kiểm thử.
- Không sửa production code chỉ để làm test pass.
- Không tạo test class trùng nếu dự án đã có test class tương ứng.

## Ví dụ từng bước

Giả sử solution có cấu trúc:

```text
MyApp.sln
src/
  MyApp/
    Services/
      OrderService.cs
tests/
  MyApp.Tests/
    Services/
      OrderServiceTests.cs
```

### 1. Xem trước coverage cần có

```text
$generate-test-cases src/MyApp/Services/OrderService.cs
```

Đọc danh sách agent trả về và kiểm tra xem các nhánh nghiệp vụ quan trọng đã đủ chưa.

### 2. Yêu cầu viết test

```text
$generate-tests src/MyApp/Services/OrderService.cs
```

### 3. Rà soát test case

Khi agent hỏi có tiếp tục sinh mã hay không, hãy kiểm tra:

- Expected outcome có đúng với contract hiện tại không.
- Có test case nào trùng với `OrderServiceTests.cs` không.
- Có đang test chi tiết cài đặt thay vì hành vi không.
- Các nhánh exception, validation và cancellation có thực sự tồn tại trong production code không.

### 4. Cho phép sinh và kiểm tra test

Sau khi bạn xác nhận, agent sẽ cập nhật test file rồi chạy các lệnh tương ứng với project, ví dụ:

```bash
dotnet build tests/MyApp.Tests/MyApp.Tests.csproj
dotnet test tests/MyApp.Tests/MyApp.Tests.csproj --filter "FullyQualifiedName~OrderServiceTests"
```

Kết quả cuối cùng cần nêu rõ file nào đã thay đổi, lệnh nào đã chạy và test có pass hay không.

## Cập nhật skill

Cập nhật skill đã cài trong project:

```bash
npx skills update -p
```

Cập nhật skill đã cài toàn cục:

```bash
npx skills update -g
```

## Xử lý lỗi thường gặp

### `npx` không được nhận diện

Cài Node.js, mở terminal mới rồi kiểm tra lại:

```bash
node --version
npm --version
npx --version
```

### PowerShell chặn `npx.ps1`

Nếu PowerShell báo `running scripts is disabled on this system`, dùng file thực thi `.cmd`:

```powershell
npx.cmd skills@latest add duchuyn04/Unit-Test-Skills -a codex --skill '*' -y
```

Cách này không yêu cầu thay đổi execution policy của máy.

### CLI báo `No skills found`

Kiểm tra bằng phiên bản mới nhất:

```bash
npx skills@latest add duchuyn04/Unit-Test-Skills --list
```

Đồng thời kiểm tra kết nối GitHub và bảo đảm repository có thể được truy cập từ máy đang cài.

### Agent không nhận ra skill

Bắt đầu một task mới và gọi đích danh skill:

```text
$generate-tests path/to/Target.cs
```

Nếu agent vẫn không nhận ra, chạy `npx skills list -a codex` để xác nhận skill đã được cài đúng cho Codex và đúng phạm vi project hoặc global.

### Test project không build được

Chạy thủ công để tách lỗi môi trường khỏi lỗi test vừa sinh:

```bash
dotnet restore
dotnet build path/to/Your.Tests.csproj
```

Nếu project đã lỗi từ trước, xử lý build blocker trước rồi mới yêu cầu agent tiếp tục sinh hoặc sửa test.

## Cấu trúc repository

```text
.
├── generate-test-cases/
│   ├── SKILL.md
│   └── rules/
│       ├── csharp/
│       └── general/
└── generate-tests/
    ├── SKILL.md
    └── rules/tests/
        ├── csharp/unit/
        ├── general/
        └── post-generation/
```

Khi sửa một rule chung, cần đồng bộ nội dung tương ứng ở cả `generate-test-cases/rules/general/` và `generate-tests/rules/tests/general/` để hai skill không áp dụng hai bộ tiêu chí khác nhau.
