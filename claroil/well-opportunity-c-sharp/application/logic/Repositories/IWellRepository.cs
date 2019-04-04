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
        Task<Metrics> WellMeasuredMetrics(Well well, int date, CancellationToken cancellationToken);
        Task<ActionOutcome> WellActionOutcome(Well well, Models.Action action, CancellationToken cancellationToken);
        Task<Models.Action> DiscoverIntervention(Metrics predictedMetrics, Metrics measuredMetrics, CancellationToken cancellationToken);
        Task<Models.Action> ShouldTestWell(float healthIndex, int lastTestDay, int today, CancellationToken cancellationToken);
        Task<float> HealthIndex(Metrics predictedMetrics, Metrics measuredMetrics, CancellationToken cancellationToken);
        Task<int> WellLastTestDate(Well well, int today, CancellationToken cancellationToken);
        Task<int> TodayDate(CancellationToken cancellationToken);
        Task<List<Opportunity>> ApplyConstraints(List<Opportunity> opportunities, Constraint constraints, CancellationToken cancellationToken);
        Task<Opportunity> CombineActionImpacts(Well well, List<ActionFinancialEstimate> costReduction, List<ActionFinancialEstimate> revenueGains, CancellationToken cancellationToken);
        Task<List<ActionFinancialEstimate>> InterventionRevenueGain(float oilPrice, Metrics measuredMetrics, ActionOutcome actionOutcome, CancellationToken cancellationToken);
        Task<List<ActionFinancialEstimate>> SkippingTestCostReduction(float oilPrice, Metrics measuredMetrics, ActionOutcome actionOutcome, CancellationToken cancellationToken);
        Task<float> CurrentOilPrice(CancellationToken cancellationToken);
    }
}
