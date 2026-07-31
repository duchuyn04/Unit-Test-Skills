namespace Eval.Customers;

public sealed class NameNormalizer
{
    public string? Normalize(string name) =>
        string.IsNullOrWhiteSpace(name) ? null : name.Trim();
}
