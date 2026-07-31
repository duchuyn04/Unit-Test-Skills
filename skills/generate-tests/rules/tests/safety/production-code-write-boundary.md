# Ranh giới ghi khi sinh test

Yêu cầu "viết test", "sinh unit test" hoặc "làm test pass" chỉ cho phép thay đổi mã kiểm thử. Yêu cầu đó **không** mặc nhiên cho phép sửa production code.

## Phạm vi mặc định

Trước lần ghi file đầu tiên:

1. Xác định test project bằng cấu trúc solution và ít nhất một dấu hiệu đáng tin cậy như `<IsTestProject>true</IsTestProject>`, `Microsoft.NET.Test.Sdk`, xUnit hoặc test project đã tồn tại.
2. Công bố thư mục test project sẽ là **allowed write set**.
3. Resolve `scripts/production-write-boundary.mjs` tương đối từ thư mục chứa `SKILL.md`, chụp trạng thái Git ban đầu và lưu state ngoài repository. Không giả định thư mục skill nằm bên trong repository đang được test.

Script theo dõi cả file tracked, untracked và file source/config nhạy cảm bị Git ignore. Các thư mục output phổ biến như `bin`, `obj`, `TestResults`, `artifacts` và `coverage` được loại khỏi kiểm tra file ignored để build không tạo false positive.

Mặc định chỉ được tạo hoặc sửa file mã kiểm thử, fixture, builder và test data nằm trong test project đã xác định.

Yêu cầu sinh test cũng không cấp quyền tạo commit. Script lưu Git `HEAD` tại thời điểm snapshot và coi mọi thay đổi `HEAD` trước bước check là vi phạm phạm vi.

Các file sau cần sự đồng ý rõ ràng của người dùng, kể cả khi nằm trong test project:

- `*.csproj`, `*.fsproj`, `*.vbproj`;
- `*.sln`, `*.slnx`;
- `Directory.Packages.props`, `NuGet.Config`, `*.props`, `*.targets`;
- file cấu hình có thể làm thay đổi cách build, restore hoặc chạy test;
- thao tác thêm, xóa hoặc nâng phiên bản package.

Khi đã được đồng ý, truyền chính xác từng đường dẫn được duyệt qua `--allow-config`. Không mở rộng sự đồng ý đó sang file khác.

## Production code luôn ở chế độ chỉ đọc

Nếu yêu cầu hiện tại chỉ là viết test, không được sửa:

- mã nguồn production như `src/**`, controller, service, domain, repository hoặc shared library;
- production project file;
- migration, schema hoặc seed data;
- `appsettings*`, secret, environment config;
- CI/CD, deployment, infrastructure hoặc build config của ứng dụng;
- validation, authorization, public contract hoặc business rule để khớp expected value của test.

Một test khó, khó mock, fail hoặc không compile không phải là quyền sửa production code. Không đổi visibility, thêm constructor, interface, virtual, wrapper, clock, factory hoặc dependency injection seam nếu chưa có một yêu cầu sửa production riêng và rõ ràng.

## Khi production code chưa test được

Nếu test cần một seam hoặc refactor production, dừng phần sinh test bị chặn và trả về:

```text
TESTABILITY_BLOCKER
- Target: {class/method}
- Test bị chặn: {test case}
- Lý do: {dependency tĩnh, thời gian hệ thống, I/O trực tiếp, global state...}
- Refactor tối thiểu đề xuất: {thay đổi nhỏ nhất để tạo seam}
- File production có thể bị ảnh hưởng: {danh sách chính xác}
- Cần xác nhận riêng: Có cho phép sửa production code theo đề xuất trên không?
```

Không triển khai refactor trong cùng lượt chỉ vì người dùng đã đồng ý sinh test. Nếu người dùng cấp quyền rõ ràng sau đó, coi đó là một nhiệm vụ sửa production code riêng, rà soát lại phạm vi và test regression trước khi sửa.

## Kiểm tra sau khi ghi

Sau khi tạo test và trước khi bàn giao:

1. Chạy chế độ `check` của script với state đã chụp.
2. Nếu nhận `WRITE_BOUNDARY_VIOLATION`, dừng lại và báo chính xác các đường dẫn ngoài phạm vi.
3. Không tiếp tục chỉnh production để làm test pass.
4. Không tự động revert hoặc xóa file vi phạm vì đó có thể là thay đổi của người dùng; báo trạng thái và chờ chỉ dẫn.

Nếu thư mục không dùng Git hoặc script không chạy được, ghi lại thủ công tất cả file sẽ sửa trước khi ghi và đối chiếu tất cả file đã sửa sau đó. Việc thiếu Git không làm nới lỏng ranh giới.

## Ví dụ lệnh

PowerShell:

```powershell
$state = Join-Path $env:TEMP "unit-test-write-boundary.json"
$boundaryScript = "<generate-tests-skill-root>/scripts/production-write-boundary.mjs"
node $boundaryScript snapshot `
  --test-root tests/MyApp.Tests `
  --state $state

# Sinh test, build và chạy test...

node $boundaryScript check `
  --state $state
```

Nếu người dùng đã cho phép sửa test project file:

```powershell
node $boundaryScript snapshot `
  --test-root tests/MyApp.Tests `
  --allow-config tests/MyApp.Tests/MyApp.Tests.csproj `
  --state $state
```
