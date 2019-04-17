namespace netBox.Repositories
{
  using System;
  using System.Collections.Generic;
  using System.Threading;
  using System.Threading.Tasks;
  using netBox.Models;

  public interface IOilRefineryRepository
  {
    Task<List<OilRefinery>> ParseOilRefineries(string input, CancellationToken cancellationToken);
  }
}
