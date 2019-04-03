namespace netBox.Repositories
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using netBox.Models;

    public class DroidRepository : IDroidRepository
    {
        public Task<Droid> GetDroid(Guid id, CancellationToken cancellationToken) =>
            Task.FromResult(Database.Droids.FirstOrDefault(x => x.Id == id));

        public Task<Droid> GetRandomDroid(CancellationToken cancellationToken){
            Random rnd = new Random();
            int r = rnd.Next(Database.Droids.Count);
            return Task.FromResult(Database.Droids.ToList()[r]);
        }

        public Task<List<Droid>> GetFriends(Droid droid, CancellationToken cancellationToken) =>
            Task.FromResult(Database.Droids.Where(x => droid.Friends.Contains(x.Id)).ToList());

        public Task<int> GetTotalCount(CancellationToken cancellationToken) =>
            Task.FromResult(Database.Droids.Count);
    }
}
