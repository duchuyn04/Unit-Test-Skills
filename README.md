# Unit Tests Skills cho C# và xUnit

Bộ skill này giúp AI coding agent phân tích và viết unit test cho dự án C#/.NET. Các quy tắc đi kèm tập trung vào xUnit, Moq, ASP.NET Core và quy trình kiểm tra lại bằng `dotnet build` cùng `dotnet test`.

Repository có hai skill:

| Skill | Dùng khi nào |
| --- | --- |
| `generate-test-cases` | Phân tích mã nguồn và liệt kê test case cần có, không tạo mã test. |
| `generate-tests` | Phân tích mã nguồn, lập test case để bạn rà soát, viết mã test, sau đó build và chạy test. |

## Hai skill thực hiện những gì?

### `generate-test-cases`: phân tích trước khi viết test

Skill này phù hợp khi bạn muốn biết một class hoặc method còn thiếu test gì nhưng chưa muốn thay đổi mã nguồn. Agent không chỉ đọc file được chỉ định. Nó lần theo namespace, constructor và method call để đọc thêm interface, DTO, entity, enum, custom exception cùng các type có liên quan.

Nếu test class đã tồn tại, agent đọc toàn bộ test hiện có trước khi đề xuất trường hợp mới. Mục tiêu là tìm phần coverage còn thiếu, không lặp lại những hành vi đã được kiểm tra.

Danh sách test case có thể bao gồm:

- Luồng thành công và giá trị trả về.
- Mỗi nhánh điều kiện tạo ra một kết quả quan sát được khác nhau.
- Validation được cài đặt thật trong production code.
- Exception, not found, conflict hoặc failure result.
- HTTP `400`, `401`, `403`, `404` và các status code khác nếu controller có nhánh tương ứng.
- Authorization policy hoặc attribute bảo mật.
- Nhánh trong private/protected method, nhưng được kiểm tra thông qua public API gọi tới nhánh đó.
- Async, nullable contract và `CancellationToken` khi target có xử lý rõ ràng.
- Side effect như lưu entity, gọi dependency hoặc phát sinh dữ liệu đầu ra.

Skill không tự thêm các trường hợp mang tính suy đoán. Ví dụ, nó không đề xuất test `null` nếu contract không cho phép `null`, không tạo nhiều test chỉ để thay đổi kích thước collection khi hành vi giống nhau, và không test trực tiếp private method.

Đầu ra của mỗi test case có tên test dự kiến, Given, When, Then, nhánh mã, căn cứ kỳ vọng, rủi ro và loại test. Skill không tạo hoặc sửa file `.cs`.

### `generate-tests`: viết test và kiểm chứng kết quả

Skill này thực hiện toàn bộ quy trình từ phân tích đến chạy test. Trước khi sinh mã, agent vẫn lập danh sách test case như `generate-test-cases` và dừng lại để bạn rà soát. Chỉ sau khi được xác nhận, agent mới tạo hoặc cập nhật test file.

Khi viết mã, skill xử lý từng nhóm target như sau:

| Nhóm target | Cách kiểm thử |
| --- | --- |
| Service và domain logic | Khởi tạo class trực tiếp, mock dependency bằng Moq, kiểm tra state, return value, exception và side effect. Không khởi động ASP.NET Core nếu không cần. |
| ASP.NET Core controller | Unit test trực tiếp action khi chỉ cần kiểm tra logic và ánh xạ sang `IActionResult`. Dùng `WebApplicationFactory<Program>` khi cần kiểm tra routing, model binding, validation, authentication hoặc serialization thực tế. |
| Repository, messaging hoặc loại khác | Dùng rule service/domain làm nền, đọc contract thực tế và nói rõ khi chưa có rule chuyên biệt. |
| Test class đã tồn tại | Bổ sung method còn thiếu vào đúng class, giữ naming, fixture, assertion library và mocking library đang dùng. |
| Test class chưa tồn tại | Đọc hai đến ba test class lân cận để học namespace, cấu trúc thư mục và quy ước của dự án trước khi tạo file mới. |

Trong phần arrange và verify, agent còn kiểm tra:

- Constructor, property và kiểu dữ liệu thật của test data; không đoán contract.
- Argument quan trọng được truyền vào dependency. Với DTO hoặc model, agent ưu tiên capture object rồi assertion field liên quan thay vì dùng `It.IsAny<T>()` cho mọi thứ.
- Số lần gọi dependency khi đó là một phần của hành vi.
- JSON bằng dữ liệu kỳ vọng rõ ràng, tránh tạo expected value bằng cùng logic với production code.
- Structured logging qua `ILogger<T>` khi log là contract cần xác minh.
- `Console.Out` hoặc `Console.Error` chỉ khi console output là hành vi công khai của ứng dụng.
- Async result, exception và cancellation theo đúng contract của method.

Sau khi sinh mã, agent chạy:

1. `dotnet build` cho test project và sửa lỗi biên dịch liên quan đến test vừa tạo.
2. `dotnet test --filter` để chỉ chạy test class mục tiêu.
3. Phân tích failure và sửa test nếu setup, mock hoặc expected value chưa đúng.

Agent không sửa production code hoặc đổi expected value chỉ để làm test pass. Nếu test chứng minh production code vi phạm contract, regression test được giữ ở trạng thái fail cùng expected, actual và căn cứ kết luận.

## Contract-first thay vì ưu tiên test pass

Tỷ lệ test pass không phải thước đo chất lượng của bộ test. Test được sinh theo ba loại:

| Loại | Ý nghĩa |
| --- | --- |
| Contract | Expected outcome đến từ requirement, API contract, validation, authorization policy hoặc domain invariant. |
| Regression | Tái hiện một bug đã biết hoặc một sai lệch giữa production code và contract có bằng chứng. |
| Characterization | Ghi nhận hành vi hiện tại khi chưa có nguồn độc lập để kết luận hành vi đó đúng hay sai. |

Skill dùng implementation để tìm branch, nhưng không mặc định xem implementation là nguồn sự thật. Khi regression test fail vì code vi phạm contract, agent giữ test đó và báo bug. Khi contract chưa rõ, agent hỏi người dùng thay vì cố làm test pass hoặc tự kết luận production code có lỗi.

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

### Cài cho agent khác

Thay giá trị của `-a` để cài trực tiếp cho agent đang sử dụng:

```bash
# Claude Code
npx skills@latest add duchuyn04/Unit-Test-Skills -a claude-code --skill '*' -y

# Cursor
npx skills@latest add duchuyn04/Unit-Test-Skills -a cursor --skill '*' -y

# GitHub Copilot
npx skills@latest add duchuyn04/Unit-Test-Skills -a github-copilot --skill '*' -y
```

Nếu bỏ cờ `-a` và `-y`, CLI sẽ dò các agent có trên máy và cho phép bạn chọn nơi cài theo cách tương tác:

```bash
npx skills@latest add duchuyn04/Unit-Test-Skills
```

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

1. Agent đọc target, dependency, test project, `.csproj`, global using và các test lân cận; sau đó công bố thư mục test được phép ghi.
2. Agent lập danh sách test case cho từng hành vi và nhánh mã cần thiết.
3. Agent dừng lại để bạn rà soát danh sách test case.
4. Sau khi được xác nhận, agent chụp trạng thái Git ban đầu rồi chỉ tạo mới hoặc cập nhật test class trong test project đã xác định.
5. Agent chạy `dotnet build`, chạy đúng nhóm test vừa tạo bằng `dotnet test --filter`, rồi kiểm tra không có file ngoài phạm vi bị thay đổi.

Ở bước rà soát, bạn có thể chỉnh danh sách trước khi cho phép sinh mã. Ví dụ:

```text
Bỏ test case kiểm tra null vì contract không cho phép null.
Thêm trường hợp CancellationToken đã bị hủy, sau đó tiếp tục sinh test.
```

## Bảo vệ production code

Khi bạn gọi `generate-tests`, câu lệnh đó chỉ cho phép agent thay đổi mã kiểm thử. Production code được xem là **chỉ đọc**, kể cả khi một test khó viết, không compile hoặc đang fail.

Quy trình bảo vệ gồm bốn lớp:

1. Agent nhận diện test project bằng cấu trúc solution, `IsTestProject`, `Microsoft.NET.Test.Sdk`, xUnit hoặc test project hiện có.
2. Trước khi ghi file, agent chụp baseline của working tree và công bố **allowed write set**, ví dụ `tests/MyApp.Tests/**`.
3. Sau khi sinh và chạy test, script đối chiếu trạng thái mới với baseline. Thay đổi production mới phát sinh hoặc Git `HEAD` bị đổi do agent tự commit sẽ trả về `WRITE_BOUNDARY_VIOLATION` cùng chi tiết chính xác.
4. Agent không tự động revert file vi phạm vì working tree có thể chứa thay đổi của bạn; nó dừng và báo lại để bạn quyết định.

Trong test project, agent mặc định chỉ được sửa file test, fixture, builder và test data. Các file sau vẫn cần bạn cho phép riêng:

- test project file như `.csproj`;
- solution, `Directory.Packages.props`, `NuGet.Config`, `.props`, `.targets`;
- thao tác thêm, xóa hoặc nâng version package;
- cấu hình làm thay đổi cách build, restore hoặc chạy test.

Agent không được tự ý sửa mã trong `src/**`, production project file, migration, `appsettings*`, validation, authorization, public contract, CI/CD hoặc deployment config để ép test pass.

### Khi test quá khó vì production code thiếu test seam

Ví dụ class gọi trực tiếp `DateTime.UtcNow`, `Guid.NewGuid()`, filesystem, network, static/global state hoặc tự `new` dependency nên không thể kiểm soát đầu vào. Agent phải dừng phần bị chặn và báo:

```text
TESTABILITY_BLOCKER
- Target: OrderService.CreateOrder
- Test bị chặn: CreateOrder_ExpiredPromotion_DoesNotApplyDiscount
- Lý do: method đọc trực tiếp DateTime.UtcNow nên test không kiểm soát được thời điểm
- Refactor tối thiểu đề xuất: inject TimeProvider
- File production có thể bị ảnh hưởng: src/MyApp/Services/OrderService.cs
- Cần xác nhận riêng: Có cho phép sửa production code theo đề xuất trên không?
```

Xác nhận “tiếp tục sinh test” không đồng nghĩa với cho phép refactor production. Bạn phải đồng ý riêng với đề xuất đó; nếu chưa đồng ý, agent tiếp tục các test khác có thể viết và giữ production code nguyên trạng.

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
- Không sửa production code khi yêu cầu chỉ là sinh test; test khó phải được báo bằng `TESTABILITY_BLOCKER` thay vì tự refactor.
- Không tạo test class trùng nếu dự án đã có test class tương ứng.

## Nguồn tham khảo từ Google Testing Blog

Các rule chung trong repository được xây dựng dựa trên những nguyên tắc unit test đã được Google trình bày trong series *Testing on the Toilet*. Ví dụ trong bài viết dùng ngôn ngữ khác, nhưng nguyên tắc đã được áp dụng lại cho C#, xUnit và Moq.

| Nguồn | Cách áp dụng trong skill |
| --- | --- |
| [Only Verify Relevant Method Arguments](https://testing.googleblog.com/2018/06/testing-on-toilet-only-verify-relevant.html) | Chỉ verify argument quyết định hành vi đang test; argument không liên quan có thể dùng matcher rộng hơn. |
| [Keep Tests Focused](https://testing.googleblog.com/2018/06/testing-on-toilet-keep-tests-focused.html) | Mỗi test chỉ kiểm tra một scenario hoặc một kết quả quan sát được. |
| [Cleanly Create Test Data](https://testing.googleblog.com/2018/02/testing-on-toilet-cleanly-create-test.html) | Dùng helper hoặc builder để giảm dữ liệu thừa, nhưng field quan trọng với test phải được khai báo rõ. |
| [Keep Cause and Effect Clear](https://testing.googleblog.com/2017/01/testing-on-toilet-keep-cause-and-effect.html) | Setup tạo ra kết quả cần kiểm tra được đặt gần action và assertion tương ứng. |
| [Prefer Testing Public APIs Over Implementation-Detail Classes](https://testing.googleblog.com/2015/01/testing-on-toilet-prefer-testing-public.html) | Bao phủ private/protected branch thông qua public API thay vì gọi trực tiếp implementation detail. |
| [Writing Descriptive Test Names](https://testing.googleblog.com/2014/10/testing-on-toilet-writing-descriptive.html) | Tên test chứa method hoặc hành vi, trạng thái đầu vào và kết quả mong đợi. |
| [Don't Put Logic in Tests](https://testing.googleblog.com/2014/07/testing-on-toilet-dont-put-logic-in.html) | Expected value được viết trực tiếp; tránh loop, condition hoặc phép tính có thể lặp lại bug của production code. |
| [Test Behaviors, Not Methods](https://testing.googleblog.com/2014/04/testing-on-toilet-test-behaviors-not.html) | Tách test theo hành vi thay vì mặc định một method tương ứng với đúng một test. |

Các bài viết trên là nguồn cho nguyên tắc thiết kế test. Rule dành riêng cho .NET như xUnit attribute, Moq callback, `ILogger<T>`, `WebApplicationFactory`, JSON và lệnh `dotnet` được mô tả riêng trong thư mục `skills/generate-tests/rules/tests/csharp/` và `skills/generate-tests/rules/tests/post-generation/`.

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

Kết quả cuối cùng cần nêu rõ file nào đã thay đổi, lệnh nào đã chạy, test nào pass, test nào fail và failure đó là test defect, production defect hay contract chưa rõ.

Agent cũng phải chạy write-boundary check. Nếu có file ngoài test project bị thay đổi kể từ baseline, kết quả phải nêu `WRITE_BOUNDARY_VIOLATION` và đường dẫn vi phạm; agent không được âm thầm sửa tiếp hoặc tự revert thay đổi chưa rõ chủ sở hữu.

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
├── .claude/
│   └── settings.json
├── .github/
│   ├── workflows/validate-skills.yml
│   └── CODEOWNERS
├── scripts/
│   └── validate-skills.mjs
├── skills/
│   ├── generate-test-cases/
│   │   ├── agents/openai.yaml
│   │   ├── SKILL.md
│   │   └── rules/
│   │       ├── csharp/
│   │       └── general/
│   └── generate-tests/
│       ├── agents/openai.yaml
│       ├── scripts/production-write-boundary.mjs
│       ├── SKILL.md
│       └── rules/tests/
│           ├── csharp/unit/
│           ├── general/
│           ├── post-generation/
│           └── safety/
├── templates/
│   └── AGENTS-SNIPPET.md
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
└── README.md
```

`AGENTS.md` cung cấp hướng dẫn chung cho các coding agent có hỗ trợ file này. `CLAUDE.md` là entry point dành cho Claude Code. Metadata trong `agents/openai.yaml` giúp Codex hiển thị skill rõ hơn trong giao diện. File `templates/AGENTS-SNIPPET.md` là đoạn cấu hình có thể chép vào dự án C# sử dụng các skill.

Khi sửa một rule chung, cần đồng bộ nội dung tương ứng ở cả `skills/generate-test-cases/rules/general/` và `skills/generate-tests/rules/tests/general/` để hai skill không áp dụng hai bộ tiêu chí khác nhau.

GitHub Actions chạy `scripts/validate-skills.mjs` và kiểm tra discovery bằng `npx skills` trên mỗi push hoặc pull request. Script xác minh frontmatter, tên thư mục, metadata Codex, nội dung general rule giữa hai skill và một số lỗi tương thích đã biết.
