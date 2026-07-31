# Pricing contract

`CalculatePrice(decimal subtotal)` không chấp nhận subtotal âm.
Subtotal nhỏ hơn 100 được trả nguyên giá.
Subtotal từ 100 trở lên được giảm 10%.
