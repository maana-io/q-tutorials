namespace netBox.Repositories
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using netBox.Models;

    public interface IHumanRepository
    {
        IObservable<Human> WhenHumanCreated { get; }

        Task<Human> AddHuman(Human human, CancellationToken cancellationToken);

        Task<List<Human>> GetFriends(Human human, CancellationToken cancellationToken);

        Task<Human> GetHuman(Guid id, CancellationToken cancellationToken);

        Task<Human> GetRandomHuman(CancellationToken cancellationToken);
    }
}
