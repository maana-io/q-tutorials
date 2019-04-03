namespace netBox.Repositories
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using netBox.Models;

    public interface IDroidRepository
    {
        Task<Droid> GetDroid(Guid id, CancellationToken cancellationToken);

        Task<Droid> GetRandomDroid(CancellationToken cancellationToken);

        Task<List<Droid>> GetFriends(Droid droid, CancellationToken cancellationToken);

        Task<int> GetTotalCount(CancellationToken cancellationToken);
    }
}
