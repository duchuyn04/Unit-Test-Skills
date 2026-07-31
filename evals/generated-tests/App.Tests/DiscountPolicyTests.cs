using GeneratedTestsFixture;
using Xunit;

namespace GeneratedTestsFixture.Tests;

public sealed class DiscountPolicyTests
{
    private readonly DiscountPolicy _policy = new();

    [Fact]
    public void Apply_NegativeSubtotal_ThrowsArgumentOutOfRangeException()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => _policy.Apply(-1m));
    }

    [Fact]
    public void Apply_BelowThreshold_ReturnsSubtotalUnchanged()
    {
        var actualSubtotal = _policy.Apply(99m);

        Assert.Equal(99m, actualSubtotal);
    }

    [Fact]
    public void Apply_AtThreshold_AppliesTenPercentDiscount()
    {
        var actualSubtotal = _policy.Apply(100m);

        Assert.Equal(90m, actualSubtotal);
    }

    [Fact]
    public void Apply_AboveThreshold_AppliesTenPercentDiscount()
    {
        Assert.Equal(108m, _policy.Apply(120m));
    }
}
