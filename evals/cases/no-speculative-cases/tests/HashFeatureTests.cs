namespace Eval.Hashing.Tests;

public sealed class HashFeatureTests
{
    [Fact]
    public void Compute_KnownInput_ReturnsExpectedUppercaseSha256()
    {
        var service = new HashService();
        Assert.Equal(
            "BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD",
            service.Compute("abc"));
    }
}
