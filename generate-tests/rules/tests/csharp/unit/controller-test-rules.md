---
title: Rule kiểm thử controller ASP.NET Core
impact: HIGH
impactDescription: bảo đảm kiểm thử đúng web layer và HTTP contract
tags: csharp, dotnet, tests, aspnet-core, controller, webapplicationfactory
---

## Rule kiểm thử controller ASP.NET Core

Dùng xUnit với `WebApplicationFactory<Program>` khi cần kiểm tra routing, model binding, validation, authentication, serialization và status code. Nếu chỉ kiểm tra nhánh logic của controller action, khởi tạo controller trực tiếp và mock service.

### Chọn đúng phạm vi test

- Dùng controller unit test cho logic trong action và mapping từ service result sang `IActionResult`.
- Dùng `WebApplicationFactory<Program>` cho HTTP pipeline thực tế.
- Không khởi động database hoặc external service thật; thay dependency trong DI container.
- Không dùng host đầy đủ khi chỉ cần kiểm tra một method thuần.

### Setup HTTP test

```csharp
public sealed class UserControllerTests :
    IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly Mock<IUserService> _userServiceMock;

    public UserControllerTests(WebApplicationFactory<Program> factory)
    {
        _userServiceMock = new Mock<IUserService>();

        var configuredFactory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IUserService>();
                services.AddSingleton(_userServiceMock.Object);
            });
        });

        _client = configuredFactory.CreateClient();
    }

    [Fact]
    public async Task GetUser_ExistingId_Returns200WithUser()
    {
        var expectedUser = new User("1", "John", "john@test.com");
        _userServiceMock
            .Setup(x => x.FindByIdAsync("1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedUser);

        var response = await _client.GetAsync("/api/users/1");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var actualUser = await response.Content.ReadFromJsonAsync<User>();
        Assert.NotNull(actualUser);
        Assert.Equal("1", actualUser.Id);
        Assert.Equal("John", actualUser.Name);
        Assert.Equal("john@test.com", actualUser.Email);
    }
}
```

### Nội dung cần kiểm thử

1. **Request mapping**: URL, HTTP method và content type.
2. **Request validation**: data annotation và custom validator trả đúng status.
3. **Response status**: tách riêng 200, 201, 400, 401, 403, 404 và 409 khi mã phân biệt chúng.
4. **Response body**: cấu trúc JSON và field liên quan.
5. **Route/query parameter**: binding và giá trị mặc định.
6. **Exception handling**: middleware hoặc exception filter chuyển exception thành HTTP response.
7. **Authorization**: phân biệt unauthenticated và forbidden.

### Kiểm thử validation

```csharp
[Fact]
public async Task CreateUser_BlankName_Returns400()
{
    const string requestJson = """
        {
          "name": "",
          "email": "john@test.com"
        }
        """;

    using var content = new StringContent(
        requestJson,
        Encoding.UTF8,
        "application/json");

    var response = await _client.PostAsync("/api/users", content);

    Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
}
```

### Kiểm thử authorization

Tạo authentication handler dành cho test và cấu hình claim/role theo từng kịch bản. Phải có test riêng cho 401 và 403.

```csharp
[Fact]
public async Task DeleteUser_AdminRole_Returns204()
{
    using var request = new HttpRequestMessage(
        HttpMethod.Delete,
        "/api/admin/users/1");
    request.Headers.Authorization =
        new AuthenticationHeaderValue(TestAuthHandler.Scheme, "admin");

    var response = await _client.SendAsync(request);

    Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
}

[Fact]
public async Task DeleteUser_Unauthenticated_Returns401()
{
    var response = await _client.DeleteAsync("/api/admin/users/1");

    Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
}
```

### Xử lý exception từ service

```csharp
[Fact]
public async Task GetUser_NonExistentId_Returns404()
{
    _userServiceMock
        .Setup(x => x.FindByIdAsync("999", It.IsAny<CancellationToken>()))
        .ThrowsAsync(new UserNotFoundException("999"));

    var response = await _client.GetAsync("/api/users/999");

    Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
}
```

### Pagination và query parameter

```csharp
[Fact]
public async Task ListUsers_WithPagination_Returns200WithPage()
{
    _userServiceMock
        .Setup(x => x.FindAllAsync(0, 10, It.IsAny<CancellationToken>()))
        .ReturnsAsync(new Page<User>(
            new[] { new User("1", "John", "john@test.com") },
            totalCount: 1));

    var response = await _client.GetAsync("/api/users?page=0&size=10");

    Assert.Equal(HttpStatusCode.OK, response.StatusCode);
}
```
