---
title: Chỉ xác minh method argument có liên quan
impact: MEDIUM
impactDescription: giảm test dễ vỡ và tập trung xác minh hành vi đang kiểm thử
tags: tests, verification, mocks, arguments, focused
---

## Chỉ xác minh các đối số phương thức có liên quan

Khi xác minh interaction của mock, chỉ kiểm tra argument liên quan đến hành vi cụ thể đang được kiểm thử. Dùng `It.IsAny<T>()` cho argument không liên quan.

### Vấn đề: Xác minh quá nhiều chi tiết

**Không đúng:**

```csharp
[Fact]
public void DisplayGreeting_ShowsSpecialGreetingOnNewYearsDay()
{
    _clock.SetTime(NewYearsDay);

    _userGreeter.DisplayGreeting();

    _userPrompterMock.Verify(x => x.UpdatePrompt(
        "Hi Frank Sinatra! Happy New Year!", TitleBar.Main, PromptStyle.Highlight), Times.Once);
}
```

**Đúng:**

```csharp
[Fact]
public void DisplayGreeting_ShowsSpecialGreetingOnNewYearsDay()
{
    _clock.SetTime(NewYearsDay);

    _userGreeter.DisplayGreeting();

    _userPrompterMock.Verify(x => x.UpdatePrompt(
        "Hi Frank Sinatra! Happy New Year!", It.IsAny<TitleBar>(), It.IsAny<PromptStyle>()), Times.Once);
}
```

### Lợi ích

1. **Test có trọng tâm**: mỗi test xác minh một hành vi.
2. **Test bền vững**: thay đổi argument không liên quan không làm hỏng test.
3. **Ý định rõ ràng**: dễ nhận ra hành vi đang được kiểm thử.

### Khi nào cần xác minh mọi argument

Chỉ xác minh mọi argument khi tất cả đều liên quan đến hành vi:

```csharp
[Fact]
public void DisplayCriticalAlert_UsesMainTitleAndErrorStyle()
{
    var alert = new Alert("Payment failed", TitleBar.Main, PromptStyle.Error);

    _alertPresenter.Display(alert);

    _userPrompterMock.Verify(x => x.UpdatePrompt(
        "Payment failed", TitleBar.Main, PromptStyle.Error), Times.Once);
}
```

### Capture argument bằng Moq callback

Với object phức tạp, chỉ capture và xác minh các field liên quan:

```csharp
[Fact]
public void CreateOrder_SetsCorrectProductId()
{
    Order? savedOrder = null;
    _repositoryMock.Setup(x => x.Save(It.IsAny<Order>())).Callback<Order>(order => savedOrder = order);

    _orderService.CreateOrder(new OrderRequest("product-123", 5));

    Assert.Equal("product-123", savedOrder!.ProductId);
}
```
