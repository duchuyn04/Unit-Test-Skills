namespace GeneratedTestsFixture;

public sealed class DiscountPolicy
{
    public decimal Apply(decimal subtotal)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(subtotal);
        return subtotal > 100m ? subtotal * 0.9m : subtotal;
    }
}
