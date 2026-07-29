---
title: JSON serialization trong test
impact: HIGH
impactDescription: tránh test dễ vỡ và làm test data rõ ràng
tags: csharp, dotnet, tests, json, serialization, system-text-json
---

## JSON serialization trong test

Dùng JSON string literal rõ ràng khi payload hoặc JSON contract là nội dung đang kiểm thử. Không dùng runtime serializer để tạo cả actual lẫn expected JSON vì cách đó có thể che giấu lỗi cấu hình.

### Rule

- Không dùng `JsonSerializer.Serialize` để tạo expected JSON trong assertion.
- Dùng raw string literal cho request body, stub response và expected contract.
- Có thể dùng `ReadFromJsonAsync<T>` để đọc response khi test quan tâm đến dữ liệu, không quan tâm JSON contract.
- Khi test JSON contract, parse bằng `JsonDocument` rồi assertion field liên quan; không so sánh toàn bộ chuỗi nếu thứ tự property không thuộc contract.

**Không đúng:**

```csharp
[Fact]
public async Task CreateUser_ValidRequest_Returns201()
{
    var request = new UserRequest("John", "john@test.com");
    var requestJson = JsonSerializer.Serialize(request);

    using var content = new StringContent(
        requestJson,
        Encoding.UTF8,
        "application/json");

    var response = await _client.PostAsync("/users", content);

    Assert.Equal(HttpStatusCode.Created, response.StatusCode);
}
```

**Đúng:**

```csharp
[Fact]
public async Task CreateUser_ValidRequest_Returns201()
{
    const string requestJson = """
        {
          "name": "John",
          "email": "john@test.com"
        }
        """;

    using var content = new StringContent(
        requestJson,
        Encoding.UTF8,
        "application/json");

    var response = await _client.PostAsync("/users", content);

    Assert.Equal(HttpStatusCode.Created, response.StatusCode);
}
```

### Xác minh response JSON

```csharp
[Fact]
public async Task GetUser_ExistingId_ReturnsUserJson()
{
    _serviceMock
        .Setup(x => x.FindByIdAsync("1", It.IsAny<CancellationToken>()))
        .ReturnsAsync(new User("1", "John"));

    var response = await _client.GetAsync("/users/1");
    var responseJson = await response.Content.ReadAsStringAsync();
    using var document = JsonDocument.Parse(responseJson);

    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    Assert.Equal("1", document.RootElement.GetProperty("id").GetString());
    Assert.Equal("John", document.RootElement.GetProperty("name").GetString());
}
```

### Stub HTTP response

Mẫu dưới đây dùng extension từ `Moq.Contrib.HttpClient`. Chỉ dùng khi test project đã tham chiếu package đó. Nếu chưa có, giữ pattern `HttpMessageHandler` giả hoặc HTTP test utility hiện có của dự án; không tự thêm package chỉ để dùng đúng mẫu này.

```csharp
const string responseJson = """
    {
      "status": "success",
      "data": { "value": 42 }
    }
    """;

_httpHandlerMock
    .SetupRequest(HttpMethod.Get, "https://example.test/api/data")
    .ReturnsResponse(
        HttpStatusCode.OK,
        responseJson,
        "application/json");
```

### Lợi ích

1. **Dễ đọc**: expected data hiển thị trực tiếp trong test.
2. **Deterministic**: expected value không phụ thuộc serializer configuration.
3. **Dễ debug**: nhìn thấy chính xác contract đang được kiểm thử.
4. **Dễ bảo trì**: thay đổi serializer ngoài phạm vi test không làm expected value thay đổi âm thầm.
