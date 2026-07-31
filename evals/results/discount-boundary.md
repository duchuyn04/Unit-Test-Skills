# Fixture: `discount-boundary`

**Target:** `src/PricingService.cs`
**Contract:** `CONTRACT.md`
**Coverage hiện có:** Test hiện có đã bao phủ subtotal âm và subtotal lớn hơn ngưỡng (`120m`). Không lặp lại hai kịch bản này.

## Test case cho PricingService.CalculatePrice

### 1. `CalculatePrice_BelowThreshold_ReturnsSubtotal`

- **Given:** `subtotal` là `99m`, ngay dưới ngưỡng giảm giá.
- **When:** Gọi `CalculatePrice(99m)`.
- **Then:** Trả về nguyên giá `99m`.
- **Code branch:** Nhánh subtotal nhỏ hơn `100m`, không áp dụng giảm giá.
- **Căn cứ kỳ vọng:** `CONTRACT.md:4` — subtotal nhỏ hơn 100 được trả nguyên giá.
- **Rủi ro:** Dịch vụ áp dụng giảm giá quá sớm hoặc tính sai giá cho subtotal dưới ngưỡng.
- **Loại:** Contract

### 2. `CalculatePrice_AtThreshold_AppliesTenPercentDiscount`

- **Given:** `subtotal` bằng đúng ngưỡng `100m`.
- **When:** Gọi `CalculatePrice(100m)`.
- **Then:** Trả về `90m`, tương ứng giảm 10%.
- **Code branch:** Giá trị biên tại ngưỡng giảm giá; contract quy định `>= 100m`, trong khi điều kiện hiện tại dùng `> 100m`.
- **Căn cứ kỳ vọng:** `CONTRACT.md:5`; sai lệch có bằng chứng tại `src/PricingService.cs:8`.
- **Rủi ro:** Lỗi off-by-one khiến subtotal đúng `100m` không được giảm giá.
- **Loại:** Regression

Không đề xuất thêm case cho `0m` hoặc các giá trị khác dưới `100m`, vì chúng đi cùng nhánh, cùng nguyên nhân và cùng kết quả quan sát được với case `99m`.
