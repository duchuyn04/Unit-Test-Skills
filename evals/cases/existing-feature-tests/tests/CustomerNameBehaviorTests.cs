namespace Eval.Customers.Tests;

public sealed class CustomerNameBehaviorTests
{
    [Fact]
    public void Normalize_ValidPaddedName_ReturnsTrimmedName()
    {
        var normalizer = new NameNormalizer();
        Assert.Equal("Alice", normalizer.Normalize("  Alice  "));
    }
}
