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
        Models.Action DiscoverIntervention(Metrics predictedMetrics, Metrics measuredMetrics, CancellationToken cancellationToken);
        Models.Action ShouldTestWell(float healthIndex, int lastTestDay, int today, CancellationToken cancellationToken);
        float HealthIndex(Metrics predictedMetrics, Metrics measuredMetrics, CancellationToken cancellationToken);
        Task<int> WellLastTestDate(Well well, int today, CancellationToken cancellationToken);
        int TodayDate(CancellationToken cancellationToken);
        List<Opportunity> ApplyConstraints(List<Opportunity> opportunities, Constraint constraints, CancellationToken cancellationToken);
        Opportunity CombineActionImpacts(Well well, List<ActionFinancialEstimate> costReduction, List<ActionFinancialEstimate> revenueGains, CancellationToken cancellationToken);
        List<ActionFinancialEstimate> InterventionRevenueGain(float oilPrice, Metrics measuredMetrics, ActionOutcome actionOutcome, CancellationToken cancellationToken);
        List<ActionFinancialEstimate> SkippingTestCostReduction(float oilPrice, Metrics measuredMetrics, ActionOutcome actionOutcome, CancellationToken cancellationToken);
        float CurrentOilPrice(CancellationToken cancellationToken);
    }
}
