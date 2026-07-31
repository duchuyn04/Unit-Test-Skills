using System.Security.Cryptography;
using System.Text;

namespace Eval.Hashing;

public sealed class HashService
{
    public string Compute(string input) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(input)));
}
