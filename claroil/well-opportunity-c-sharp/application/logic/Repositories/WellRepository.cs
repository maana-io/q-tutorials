namespace netBox.Repositories
{
  using System;
  using System.Collections.Generic;
  using System.Linq;
  using System.Threading;
  using System.Threading.Tasks;
  using netBox.Models;
  using GraphQL.Common.Request;

  public class WellRepository : IWellRepository
  {
    public async Task<List<Well>> AllActiveWells(CancellationToken cancellationToken)
    {
      var allWellsRequest = new GraphQLRequest();
      allWellsRequest.Query = @"{
                wells (ids: [
                    ""test""
                ]) {
                    id
                    name
                }
                }";
      //     allWellsRequest.Query = @"{
      //     wells (ids:[
      //         ""Pu-01"",""Pu-02"",""Pu-03"",""Pu-04"",""Pu-05"",
      //         ""Co-01"",""Co-02"",
      //         ""Ga-01"",""Ga-02"",""Ga-03"",""Ga-04"",
      //         ""Cr-01"",""Cr-02"",
      //         ""Pd-01"",""Pd-02""
      //       ]) {
      //       id
      //       name
      //     }
      //   }";

      var response = await Database.GraphQLClient.PostAsync(allWellsRequest);
      return response.GetDataFieldAs<List<Well>>("wells");
    }
    public async Task<Metrics> WellPredictedMetrics(Well well, int date, CancellationToken cancellationToken)
    {
      var allMetricssRequest = new GraphQLRequest();
      allMetricssRequest.Query = @"{
                allMetricss {
                    id
                    well {id name}
                    date
                    type
                    waterCut
                    GOR
                    oilRate
                }
                }";

      var response = await Database.GraphQLClient.PostAsync(allMetricssRequest);
      var allMetrics = response.GetDataFieldAs<List<Metrics>>("allMetricss");
      // var filteredMetrics = allMetrics.FindAll(x => x.date == date && x.well.id == well.id && x.type == "predicted");
      var len = 1; //filteredMetrics.length;
      var metric = new Metrics();
      if (len > 0)
      {
        // metric = filteredMetrics[0];
      }
      else
      {
        metric.id = "1";
        metric.date = date;
        //   metric.type = "predicted";
        metric.waterCut = 1;
        metric.GOR = 1;
        metric.oilRate = 1;
      }
      return metric;
    }

    public Task<Metrics> WellMeasuredMetrics(Well well, int date, CancellationToken cancellationToken)
    {
      // TODO: Implement
      return Task.FromResult(new Metrics());
    }

    public Task<ActionOutcome> WellActionOutcome(Well well, Models.Action action, CancellationToken cancellationToken)
    {
      // TODO: Implement
      return Task.FromResult(new ActionOutcome());
    }

    public Task<Models.Action> DiscoverIntervention(Metrics predictedMetrics, Metrics measuredMetrics, CancellationToken cancellationToken)
    {
      // TODO: Implement
      return Task.FromResult(new Models.Action());
    }

    public Task<Models.Action> ShouldTestWell(float healthIndex, int lastTestDay, int today, CancellationToken cancellationToken)
    {
      // TODO: Implement
      return Task.FromResult(new Models.Action());
    }

    public float HealthIndex(Metrics predictedMetrics, Metrics measuredMetrics, CancellationToken cancellationToken)
    {
      //Watercut
      var predictedWatercut = predictedMetrics.waterCut;
      var measuredWatercut = measuredMetrics.waterCut;
      var waterCutHealthIndex =
        predictedWatercut != 0
          ? 1 -
            Math.Abs((predictedWatercut - measuredWatercut) / predictedWatercut)
          : 0;

      //GOR
      var predictedGOR = predictedMetrics.GOR;
      var measuredGOR = measuredMetrics.GOR;
      var GORHealthIndex =
        predictedGOR != 0
          ? 1 - Math.Abs((predictedGOR - measuredGOR) / predictedGOR)
          : 0;

      //OilRate
      var predictedOilRate = predictedMetrics.oilRate;
      var measuredOilRate = measuredMetrics.oilRate;
      var oilRateHealthIndex =
        predictedOilRate != 0
          ? 1 -
            Math.Abs((predictedOilRate - measuredOilRate) / predictedOilRate)
          : 0;

      var hidx = (1 / 3) * waterCutHealthIndex +
                     (1 / 3) * GORHealthIndex +
                     (1 / 3) * oilRateHealthIndex;

      return hidx;
    }

    public async Task<int> WellLastTestDate(Well well, int today, CancellationToken cancellationToken)
    {
      var allMetricssRequest = new GraphQLRequest();
      allMetricssRequest.Query = @"{
        allMetricss {
          well {id}
          date
          type
          waterCut
          GOR
          oilRate
        }
      }";

      var response = await Database.GraphQLClient.PostAsync(allMetricssRequest);
      var allMetrics = response.GetDataFieldAs<List<Metrics>>("allMetricss");

      var pastMeasuredMetrics = allMetrics.Where(x => x.date <= today && x.well.id == well.id && x.type == "measured");
      var len = pastMeasuredMetrics.Count();
      var date = 0;

      if (len > 0)
      {
        var orderedMeasuredMetrics = pastMeasuredMetrics.OrderByDescending(x => x.date);
        var singleMeasurement = orderedMeasuredMetrics.First();
        date = singleMeasurement.date;
      }

      return date;
    }

    public int TodayDate(CancellationToken cancellationToken)
    {
      return 1222;
    }

    public List<Opportunity> ApplyConstraints(List<Opportunity> opportunities, Constraint constraints, CancellationToken cancellationToken)
    {
      var totalBudget = constraints.budget;
      var totalManHours = constraints.manHours;

      var sortedOpportunities = opportunities.OrderBy(op => op.cost).OrderByDescending(op => op.incrementalRevenue + op.costReduction);
      var filteredOpportunities = sortedOpportunities.Where(entry =>
      {
        var cost = entry.cost;
        var manHours = entry.manHours;

        if ((totalBudget - cost >= 0) && (totalManHours - manHours >= 0))
        {
          totalBudget = totalBudget - cost;
          totalManHours = totalManHours - manHours;
          return true;
        }
        else
        {
          return false;
        }
      });

      return filteredOpportunities.ToList();
    }

    public Opportunity CombineActionImpacts(Well well, List<ActionFinancialEstimate> costReduction, List<ActionFinancialEstimate> revenueGains, CancellationToken cancellationToken)
    {
      var incrementalRevenueSum = revenueGains.Aggregate(0F, (accumulator, actionFinancialEstimate) =>
      {
        var impact = actionFinancialEstimate.impact;
        return accumulator + impact;
      });

      var costReductionSum = costReduction.Aggregate(0F, (accumulator, actionFinancialEstimate) =>
      {
        var impact = actionFinancialEstimate.impact;
        return accumulator + impact;
      });

      var combinedLists = costReduction.Concat(revenueGains);

      var costSum = combinedLists.Aggregate(0F, (accumulator, actionFinancialEstimate) =>
      {
        var cost = actionFinancialEstimate.cost;
        return accumulator + cost;
      });

      var manHoursSum = combinedLists.Aggregate(0F, (accumulator, actionFinancialEstimate) =>
      {
        var manHours = actionFinancialEstimate.manHours;
        return accumulator + manHours;
      });

      // TODO: Implement
      return new Opportunity
      {
        id = new Guid().ToString(),
        well = well,
        name = "Opportunity for " + well.name,
        createdAt = new DateTime(),
        actions = combinedLists.Select(x => x.action).ToList(),
        incrementalRevenue = incrementalRevenueSum,
        costReduction = costReductionSum,
        cost = costSum,
        manHours = manHoursSum
      };
    }

    public List<ActionFinancialEstimate> InterventionRevenueGain(float oilPrice, Metrics measuredMetrics, ActionOutcome actionOutcome, CancellationToken cancellationToken)
    {
      var increaseInOilRate = actionOutcome.increaseInOilRate;
      var cost = actionOutcome.cost;
      var manHours = actionOutcome.manHours;
      var revenueIncrease = measuredMetrics.oilRate * oilPrice * 180 * increaseInOilRate;

      var afe = new ActionFinancialEstimate
      {
        id = new Guid().ToString(),
        action = actionOutcome.action,
        well = actionOutcome.well,
        impact = revenueIncrease,
        cost = cost,
        manHours = manHours
      };

      return new List<ActionFinancialEstimate>() { afe };
    }

    public List<ActionFinancialEstimate> SkippingTestCostReduction(float oilPrice, Metrics measuredMetrics, ActionOutcome actionOutcome, CancellationToken cancellationToken)
    {
      var probabilityOfAnomaly = actionOutcome.probabilityOfAnomaly / 100;
      var potentialCostOfSkippikingATest = measuredMetrics.oilRate * probabilityOfAnomaly * oilPrice * 60;
      var costReduction = actionOutcome.cost;
      var manHours = actionOutcome.manHours;

      var afe = new ActionFinancialEstimate
      {
        id = new Guid().ToString(),
        action = actionOutcome.action,
        well = actionOutcome.well,
        impact = costReduction,
        cost = potentialCostOfSkippikingATest,
        manHours = manHours
      };

      return new List<ActionFinancialEstimate> { afe };
    }

    public float CurrentOilPrice(CancellationToken cancellationToken)
    {
      return 10.0F;
    }
  }
}
