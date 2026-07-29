# Hướng dẫn cho Claude Code

Đọc và tuân thủ [AGENTS.md](AGENTS.md) trước khi sửa repository này.

Repository chứa Agent Skills và tài liệu rule, không có application build riêng. Hai entry point nằm tại:

- `skills/generate-test-cases/SKILL.md`: phân tích coverage và lập test case, không sinh mã test.
- `skills/generate-tests/SKILL.md`: lập test case, chờ người dùng xác nhận, sinh test C# bằng xUnit/Moq, rồi build và chạy test.

Khi sửa general rule, phải cập nhật cả hai bản sao được nêu trong `AGENTS.md`. Không đưa rule dành riêng cho Java hoặc framework ngoài .NET vào repository này nếu chưa có yêu cầu rõ ràng.
