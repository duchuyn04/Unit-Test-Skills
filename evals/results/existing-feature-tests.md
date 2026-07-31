# Fixture: `existing-feature-tests`

**Target:** `src/NameNormalizer.cs`
**Existing tests:** `tests/CustomerNameBehaviorTests.cs`
**Detected test style:** xUnit with `[Fact]` and `Assert.Equal`.

## Existing coverage

`Normalize_ValidPaddedName_ReturnsTrimmedName` already verifies that a valid padded name is trimmed and its capitalization is preserved (`tests/CustomerNameBehaviorTests.cs:6-9`). No additional valid-name test is proposed because it would repeat the same branch and observable behavior.

## Test case cho `NameNormalizer.Normalize`

### 1. `Normalize_WhitespaceOnlyName_ReturnsNull`

- **Given:** Tên chỉ gồm whitespace, chẳng hạn `"   "`.
- **When:** Gọi `Normalize`.
- **Then:** Kết quả trả về là `null`.
- **Code branch:** Nhánh `string.IsNullOrWhiteSpace(name)` trả về `true` tại `src/NameNormalizer.cs:5-6`.
- **Căn cứ kỳ vọng:** `CONTRACT.md:4` — tên chỉ chứa whitespace phải trả về `null`.
- **Rủi ro:** Tên không có nội dung có thể được lưu dưới dạng chuỗi rỗng hoặc whitespace thay vì bị chuẩn hóa thành `null`.
- **Loại:** Contract

## Các trường hợp không đề xuất

- Tên hợp lệ không có padding: cùng nhánh và cùng hành vi quan sát được với test hiện có.
- Các biến thể whitespace khác hoặc chuỗi rỗng: không có nhánh xử lý riêng; sẽ lặp lại hành vi của case whitespace-only.
- `null`: parameter là `string` non-nullable và contract không quy định input `null`; không thêm characterization case suy đoán.
