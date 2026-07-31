# Behavioral evaluation

Mỗi thư mục trong `cases/` là một bài toán C# độc lập gồm target, contract nếu có, test hiện hữu và `eval.json` chứa ground truth. Không đưa `eval.json` cho agent đang được forward-test.

Quy trình đánh giá một release:

1. Mở task mới, chỉ cung cấp fixture và yêu cầu dùng `$generate-test-cases` cho target được ghi trong `eval.json`.
2. Lưu nguyên văn kết quả vào `results/{id}.md`; không sửa kết quả để khớp ground truth.
3. Chạy `node scripts/evaluate-test-case-reports.mjs`.
4. Review thủ công mọi thay đổi classification hoặc expected outcome trước khi cập nhật ground truth.

Scorer kiểm tra case bắt buộc, case suy đoán/trùng bị cấm, classification và căn cứ có thể truy vết. Nó không thay thế review nghiệp vụ; fixture mới phải có contract hoặc chủ đích Characterization rõ ràng.
