# Hướng dẫn dành cho AI agent

Repository này chứa hai Agent Skills hỗ trợ phân tích và viết unit test C#/.NET bằng xUnit và Moq. Đây không phải ứng dụng có thể chạy độc lập.

## Skill hiện có

| Skill | Nhiệm vụ |
| --- | --- |
| `generate-test-cases` | Đọc target, dependency và test hiện có; lập danh sách test case Given–When–Then nhưng không sinh mã. |
| `generate-tests` | Lập test case để người dùng rà soát, sinh hoặc cập nhật test, sau đó chạy build và test mục tiêu. |

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

## Kiểm tra repository

Sau khi thay đổi cấu trúc hoặc frontmatter, chạy:

```bash
npx skills@latest add . --list
```

Kết quả phải nhận diện được `generate-test-cases` và `generate-tests`.
