# Hướng dẫn dành cho AI agent

Repository này chứa hai Agent Skills hỗ trợ phân tích và viết unit test C#/.NET bằng xUnit và Moq. Đây không phải ứng dụng có thể chạy độc lập.

## Skill hiện có

| Skill | Nhiệm vụ |
| --- | --- |
| `generate-test-cases` | Đọc target, dependency và test hiện có; lập danh sách test case Given–When–Then nhưng không sinh mã. |
| `generate-tests` | Lập test case để người dùng rà soát, sinh hoặc cập nhật test, sau đó chạy build, test mục tiêu và toàn test project so với baseline. |

## Vị trí

```text
skills/
  generate-test-cases/
    SKILL.md
    rules/
  generate-tests/
    SKILL.md
    rules/tests/
```

Mỗi skill là một thư mục độc lập. Khi skill được gọi, đọc `SKILL.md` của skill đó và chỉ đọc các rule được workflow yêu cầu.

## Quy tắc bảo trì

- Giữ tên thư mục skill ở dạng kebab-case và tên file định nghĩa là `SKILL.md`.
- Đặt rule C# của `generate-tests` trong `skills/generate-tests/rules/tests/csharp/unit/`.
- Đặt rule hậu kiểm trong `skills/generate-tests/rules/tests/post-generation/`.
- General rule tồn tại ở hai nơi. Khi sửa, đồng bộ cả `skills/generate-test-cases/rules/general/` và `skills/generate-tests/rules/tests/general/`.
- Khi thêm hoặc đổi tên rule, cập nhật danh sách tham chiếu trong `SKILL.md` tương ứng.
- Không thêm test case suy đoán, không tạo test trùng và không sửa production code chỉ để làm test pass.
- Lấy requirement, public contract và invariant làm căn cứ expected outcome. Không lấy tỷ lệ pass làm mục tiêu; giữ regression test fail khi production code vi phạm contract có bằng chứng.
- Contract và Regression phải ghi căn cứ có thể truy vết tới đường dẫn:dòng, symbol/heading hoặc xác nhận rõ của người dùng.
- Khi yêu cầu chỉ là sinh test, production code là chỉ đọc. Trước khi ghi phải công bố test project được phép thay đổi, chụp baseline và kiểm tra write boundary sau cùng.
- Sau test mục tiêu phải chạy toàn test project và so sánh với baseline; nếu không thể, báo `FULL_SUITE_NOT_VERIFIED` và không gọi kết quả là production-ready.
- Thay đổi test project file, package hoặc build config cần người dùng cho phép riêng. Nếu test cần refactor production, dừng bằng `TESTABILITY_BLOCKER`; xác nhận sinh test không phải quyền sửa production.

## Kiểm tra repository

Sau khi thay đổi cấu trúc hoặc frontmatter, chạy:

```bash
node scripts/validate-skills.mjs
node scripts/test-production-write-boundary.mjs
node scripts/test-evaluate-test-case-reports.mjs
node scripts/evaluate-test-case-reports.mjs
node scripts/test-generated-test-fixture.mjs
npx skills@1.5.20 add . --list
```

Kết quả phải nhận diện được `generate-test-cases` và `generate-tests`.
