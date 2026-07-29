# Đoạn cấu hình AGENTS.md cho dự án C#

Chép phần bên dưới vào file `AGENTS.md` ở thư mục gốc của dự án cần viết test. Đoạn này giúp agent biết khi nào nên gọi từng skill và các nguyên tắc quan trọng cần giữ.

```markdown
## Sinh unit test C#

Dự án sử dụng hai Agent Skills:

<available_skills>
  <skill>
    <name>generate-test-cases</name>
    <description>Dùng khi cần phân tích coverage, liệt kê test case còn thiếu hoặc rà soát chiến lược kiểm thử mà chưa sinh mã test.</description>
  </skill>
  <skill>
    <name>generate-tests</name>
    <description>Dùng khi cần viết unit test C#. Skill đọc target và dependency, lập test case để rà soát, sinh test bằng framework hiện có hoặc xUnit/Moq, rồi build và chạy test mục tiêu.</description>
  </skill>
</available_skills>

### Nguyên tắc

- Mỗi test chỉ kiểm tra một hành vi hoặc kết quả quan sát được.
- Đặt tên theo `{TestedMethod}_{GivenState}_{ExpectedOutcome}`.
- Đọc DTO, entity, enum, interface và test hiện có trước khi lập test case.
- Kiểm thử private/protected branch thông qua public API.
- Không tạo test trùng, không thêm trường hợp suy đoán và không sửa production code chỉ để làm test pass.
- Giữ assertion library, mocking library và convention hiện có của test project.
```
