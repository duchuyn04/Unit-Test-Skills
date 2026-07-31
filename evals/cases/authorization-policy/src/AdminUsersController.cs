using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Eval.Users;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "Admin")]
public sealed class AdminUsersController(IUserService users) : ControllerBase
{
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken) =>
        await users.DeleteAsync(id, cancellationToken) ? NoContent() : NotFound();
}

public interface IUserService
{
    Task<bool> DeleteAsync(string id, CancellationToken cancellationToken);
}
