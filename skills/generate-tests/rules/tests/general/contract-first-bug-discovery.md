---
title: Kiểm thử theo contract và tìm lỗi
impact: HIGH
impactDescription: tránh viết test chỉ lặp lại implementation và ưu tiên phát hiện sai lệch nghiệp vụ
tags: tests, contract, bug-discovery, regression, characterization
---

## Kiểm thử theo contract và tìm lỗi

Mục tiêu là tăng độ tin cậy vào hành vi phần mềm, không tối đa tỷ lệ test pass hoặc cố tạo một tỷ lệ test fail. Test đúng phải pass khi production code đúng contract và fail khi contract bị vi phạm.

### Chọn nguồn sự thật

Xác định expected outcome theo thứ tự ưu tiên:

1. Acceptance criteria, requirement, use case hoặc mô tả nghiệp vụ do người dùng cung cấp.
2. Public API contract như OpenAPI, XML documentation, interface contract, validation rule, authorization policy và invariant của domain.
3. Hành vi đã được khẳng định bởi test đáng tin cậy hoặc tài liệu dự án.
4. Production implementation, chỉ dùng để tìm branch và quan sát hành vi hiện tại; không mặc định xem implementation là expected behavior.

Nếu chỉ có production code và không có nguồn độc lập:

- Gắn nhãn test là **Characterization**.
- Mô tả rằng test ghi nhận hành vi hiện tại, chưa chứng minh hành vi đó đúng nghiệp vụ.
- Hỏi người dùng khi việc chọn expected outcome có thể làm thay đổi contract đáng kể.
- Không tự đổi actual behavior thành expected chỉ để test pass.

### Tìm lỗi có chủ đích

Chọn các trường hợp dưới đây khi contract hoặc code cho thấy chúng có liên quan:

- Giá trị biên: ngay dưới, đúng tại và ngay trên threshold.
- Input thiếu, rỗng, sai định dạng hoặc sai trạng thái.
- Invariant trước và sau khi thay đổi state.
- Dependency trả lỗi, timeout, cancellation hoặc partial failure.
- Side effect không được phép xảy ra khi operation thất bại.
- Authentication, authorization và phân tách 401/403.
- Mapping làm mất field, sai kiểu, sai status hoặc sai JSON contract.
- Duplicate request, retry, idempotency, race condition hoặc concurrency khi hệ thống có cơ chế tương ứng.

Không thêm case kỳ lạ chỉ để làm test fail. Mọi case phải gắn với contract, branch, invariant hoặc rủi ro thực tế có bằng chứng.

### Phân loại test case

Ghi một trong ba loại:

- **Contract**: expected outcome có nguồn độc lập với implementation.
- **Regression**: tái hiện một bug đã biết hoặc sai lệch có bằng chứng.
- **Characterization**: ghi nhận hành vi hiện tại khi contract chưa rõ.

Với mỗi test case, ghi:

- **Căn cứ kỳ vọng:** nguồn có thể kiểm tra lại. Với nguồn trong repository, ghi đường dẫn tương đối kèm dòng, heading hoặc symbol, ví dụ `docs/orders.md:42` hoặc `IOrderService.CreateOrder`. Với phát biểu của người dùng, ghi rõ `Người dùng xác nhận: ...`.
- **Rủi ro:** lỗi mà test có khả năng phát hiện.
- **Loại:** Contract, Regression hoặc Characterization.

Không gắn nhãn **Contract** hoặc **Regression** nếu căn cứ chỉ là suy luận từ implementation. Nếu invariant được suy ra nhưng chưa có tài liệu hoặc xác nhận độc lập, nêu phép suy luận và tạm gắn nhãn **Characterization**. Căn cứ không tồn tại, không trỏ được tới nội dung đã đọc hoặc không hỗ trợ expected outcome là test defect.

### Khi test fail

1. Kiểm tra trước xem setup, mock, test data và expected outcome có sai không.
2. So sánh actual behavior với nguồn sự thật đã ghi.
3. Nếu test sai, sửa test và chạy lại.
4. Nếu production code vi phạm contract, giữ test fail, không đổi expected value và không xóa test.
5. Báo rõ test name, command, expected, actual và căn cứ kết luận.
6. Không sửa production code nếu người dùng chỉ yêu cầu viết test.

Một test fail không tự động chứng minh có bug. Chỉ kết luận production bug khi có nguồn kỳ vọng độc lập và failure tái hiện được.
