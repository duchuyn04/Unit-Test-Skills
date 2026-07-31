# Fixture: `no-speculative-cases`

**Target:** `src/HashService.cs`
**Existing tests:** `tests/HashFeatureTests.cs`
**Detected test style:** xUnit with `[Fact]` and `Assert.Equal`.

## Kết luận coverage

Mọi hành vi được contract xác định đã có coverage. Không cần thêm test case.

Test `Compute_KnownInput_ReturnsExpectedUppercaseSha256` đối chiếu `Compute("abc")` với digest SHA-256 hexadecimal viết hoa chính xác (`tests/HashFeatureTests.cs:6-11`), qua đó bao phủ hành vi được nêu tại `CONTRACT.md:3`. Implementation không có nhánh phụ thuộc nội dung hoặc kích thước input (`src/HashService.cs:8-9`), nên thêm các input thông thường khác chỉ lặp lại cùng nhánh và kết quả quan sát được.

## Nội dung đã được kiểm thử

- Tính SHA-256 cho input do caller cung cấp.
- Trả digest ở dạng hexadecimal.
- Dùng chữ cái hexadecimal viết hoa.

## Các trường hợp không đề xuất

- `null`, input rất lớn hoặc các lớp Unicode đặc biệt: `CONTRACT.md:4` nói rõ các hành vi này không được quy định.
- Chuỗi rỗng hoặc thêm known-input vectors: không có logic hay nhánh riêng theo nội dung input; chúng lặp lại hành vi đã được test hiện có bao phủ.
