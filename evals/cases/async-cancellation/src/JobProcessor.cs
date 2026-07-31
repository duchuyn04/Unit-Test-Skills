namespace Eval.Jobs;

public sealed class JobProcessor(IJobRepository repository, IJobPublisher publisher)
{
    public async Task ProcessAsync(string id, CancellationToken cancellationToken)
    {
        var job = await repository.GetAsync(id, cancellationToken);
        cancellationToken.ThrowIfCancellationRequested();
        await publisher.PublishAsync(job, cancellationToken);
    }
}

public sealed record Job(string Id);
public interface IJobRepository { Task<Job> GetAsync(string id, CancellationToken cancellationToken); }
public interface IJobPublisher { Task PublishAsync(Job job, CancellationToken cancellationToken); }
