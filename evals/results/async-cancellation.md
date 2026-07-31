# Fixture: `async-cancellation`

Target: `src/JobProcessor.cs`

Existing coverage recognized: `tests/JobProcessorFeatureTests.cs:5-10` declares the successful “publish exactly once” scenario as intentionally abbreviated fixture coverage. No duplicate success-path case is proposed.

## Test cases for `JobProcessor.ProcessAsync`

### 1. `ProcessAsync_ProvidedCancellationToken_ForwardsTokenToRepository`

- **Given:** `id` is `"job-1"`, the supplied token is not cancelled, and the repository returns `Job("job-1")`.
- **When:** `ProcessAsync` is awaited with that token.
- **Then:** `IJobRepository.GetAsync` receives the exact token supplied by the caller.
- **Code branch:** Repository invocation at `src/JobProcessor.cs:7`.
- **Expected basis:** `CONTRACT.md:4` requires cancellation to be propagated to the repository.
- **Risk:** The processor substitutes or drops the caller’s token, preventing repository work from being cancelled.
- **Type:** Contract

### 2. `ProcessAsync_RepositoryObservesCancellation_ThrowsOperationCanceledException`

- **Given:** The supplied token is cancelled and the repository observes that token by completing `GetAsync` as cancelled.
- **When:** `ProcessAsync` is awaited.
- **Then:** Awaiting the operation throws `OperationCanceledException`.
- **Code branch:** Cancellation propagated by the awaited repository call at `src/JobProcessor.cs:7`.
- **Expected basis:** `CONTRACT.md:4` requires cancellation to surface as `OperationCanceledException`.
- **Risk:** Repository cancellation is swallowed, translated to an unrelated exception, or mistaken for success.
- **Type:** Contract

### 3. `ProcessAsync_RepositoryObservesCancellation_DoesNotPublish`

- **Given:** The repository observes the supplied cancelled token and completes `GetAsync` as cancelled.
- **When:** `ProcessAsync` is awaited.
- **Then:** `IJobPublisher.PublishAsync` is never called.
- **Code branch:** Exceptional completion at `src/JobProcessor.cs:7` prevents execution from reaching line 9.
- **Expected basis:** `CONTRACT.md:5` prohibits publishing after cancellation.
- **Risk:** A cancelled job is published despite repository cancellation.
- **Type:** Contract

### 4. `ProcessAsync_CancellationRequestedAfterRepositoryReturns_ThrowsOperationCanceledException`

- **Given:** The repository returns a job but requests cancellation immediately before control returns to `ProcessAsync`.
- **When:** `ProcessAsync` resumes after awaiting the repository.
- **Then:** Awaiting the operation throws `OperationCanceledException`.
- **Code branch:** Explicit post-repository cancellation check at `src/JobProcessor.cs:8`.
- **Expected basis:** `CONTRACT.md:4` requires cancellation to surface as `OperationCanceledException`.
- **Risk:** Cancellation occurring at the repository/publisher boundary is ignored.
- **Type:** Contract

### 5. `ProcessAsync_CancellationRequestedAfterRepositoryReturns_DoesNotPublish`

- **Given:** The repository returns a job while requesting cancellation before `ProcessAsync` reaches the publisher.
- **When:** `ProcessAsync` resumes.
- **Then:** `IJobPublisher.PublishAsync` is never called.
- **Code branch:** `ThrowIfCancellationRequested` at `src/JobProcessor.cs:8` terminates execution before line 9.
- **Expected basis:** `CONTRACT.md:5` prohibits publishing after the operation has been cancelled.
- **Risk:** A race between repository completion and publishing allows cancelled work to be published.
- **Type:** Contract

### 6. `ProcessAsync_RepositoryThrows_PropagatesSameException`

- **Given:** The repository throws a known non-cancellation exception instance.
- **When:** `ProcessAsync` is awaited.
- **Then:** The exact same exception instance reaches the caller.
- **Code branch:** Exceptional completion of `repository.GetAsync` at `src/JobProcessor.cs:7`.
- **Expected basis:** `CONTRACT.md:6` requires repository exceptions to be propagated unchanged.
- **Risk:** The processor swallows, wraps, or replaces the repository failure.
- **Type:** Contract

### 7. `ProcessAsync_RepositoryThrows_DoesNotPublish`

- **Given:** The repository throws a non-cancellation exception.
- **When:** `ProcessAsync` is awaited.
- **Then:** `IJobPublisher.PublishAsync` is never called.
- **Code branch:** Repository failure at `src/JobProcessor.cs:7` prevents execution from reaching line 9.
- **Expected basis:** `CONTRACT.md:6` explicitly prohibits publishing after a repository exception.
- **Risk:** The processor publishes an absent or invalid job after repository failure.
- **Type:** Contract

Excluded intentionally: null `id`, publisher-exception behavior and another publish-on-success case because the fixture provides no independent requirement or existing coverage already applies.
