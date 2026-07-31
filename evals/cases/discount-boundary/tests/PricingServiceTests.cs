namespace Eval.Pricing.Tests;

public sealed class PricingServiceTests
{
    [Fact]
    public void CalculatePrice_AboveThreshold_AppliesTenPercentDiscount()
    {
        var service = new PricingService();
        Assert.Equal(108m, service.CalculatePrice(120m));
    }

    [Fact]
    public void CalculatePrice_NegativeSubtotal_ThrowsArgumentOutOfRangeException()
    {
        var service = new PricingService();
        Assert.Throws<ArgumentOutOfRangeException>(() => service.CalculatePrice(-1m));
    }
}
