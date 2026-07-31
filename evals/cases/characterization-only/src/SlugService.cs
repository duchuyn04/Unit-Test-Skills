namespace Eval.Text;

public sealed class SlugService
{
    public string Create(string value) =>
        value.Trim().ToLowerInvariant().Replace(" ", "-");
}
