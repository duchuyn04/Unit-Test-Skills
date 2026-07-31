---
title: Xác minh khả năng phát hiện lỗi
impact: HIGH
impactDescription: phân biệt test chỉ compile/pass với test có bằng chứng bao phủ hoặc phát hiện sai lệch
tags: csharp, tests, coverage, mutation, effectiveness, regression
---

## Xác minh khả năng phát hiện lỗi

Build và test pass chưa chứng minh assertion có giá trị. Sau full-suite comparison, tìm tooling coverage hoặc mutation đã được repository cấu hình; không tự thêm package hay đổi build config chỉ để có metric.

### Khi repository đã có coverage

1. Dùng command và format sẵn có của repository.
2. So sánh baseline với kết quả sau khi thêm test.
3. Xác nhận test mới thực thi branch hoặc hành vi đã nêu trong test case; không dùng phần trăm coverage toàn project làm bằng chứng duy nhất.
4. Báo coverage delta của target, command và artifact kết quả.

### Khi repository đã có mutation testing

1. Chạy phạm vi hẹp nhất chứa system under test.
2. Kiểm tra mutant đại diện cho expected outcome của test mới đã bị kill.
3. Báo surviving mutant liên quan; không sửa expected hoặc thêm assertion không có ý nghĩa chỉ để tăng mutation score.

### Regression test đang tái hiện production bug

Failure đúng expected/actual và đúng căn cứ contract là bằng chứng test phát hiện sai lệch hiện tại. Không cần tạo mutant hoặc sửa production code. Ghi rõ command, failure và nguồn contract.

### Khi không có tooling

Không tự cài coverage/mutation package. Review assertion để bảo đảm nó quan sát output hoặc side effect thuộc contract, rồi báo `EFFECTIVENESS_NOT_MEASURED`. Trạng thái này không làm test vô hiệu, nhưng cấm tuyên bố mutation/coverage đã được xác minh.
