namespace Eval.Pricing;

public sealed class PricingService
{
    public decimal CalculatePrice(decimal subtotal)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(subtotal);
        return subtotal > 100m ? subtotal * 0.9m : subtotal;
    }
}
