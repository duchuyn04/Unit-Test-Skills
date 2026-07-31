# Job processor contract

Khi xử lý thành công, job được publish đúng một lần.
Cancellation phải được truyền tới repository và trả về `OperationCanceledException`.
Không được publish job sau khi operation đã bị hủy.
Exception từ repository phải được truyền nguyên vẹn cho caller và không được publish.
