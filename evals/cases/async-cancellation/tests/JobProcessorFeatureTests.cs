namespace Eval.Jobs.Tests;

public sealed class JobProcessorFeatureTests
{
    [Fact]
    public async Task Process_ValidJob_PublishesOnce()
    {
        // Existing success-path test omitted for fixture brevity.
        await Task.CompletedTask;
    }
}
