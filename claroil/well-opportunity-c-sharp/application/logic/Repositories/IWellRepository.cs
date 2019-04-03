namespace netBox.Repositories
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using netBox.Models;

    public interface IWellRepository
    {
        Task<List<Well>> AllActiveWells(CancellationToken cancellationToken);

        Task<Metrics> WellPredictedMetrics(Well well, int date, CancellationToken cancellationToken);
    }
}
