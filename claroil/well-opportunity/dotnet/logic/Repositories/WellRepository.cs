namespace netBox.Repositories
{
  ing System;
  ing System.Collections.Generic;
  ing System.Linq;
  ing System.Threading;
  ing System.Threading.Tasks;
  ing netBox.Models;
  ing GraphQL.Common.Request;
  ing Maana.AuthenticatedGraphQLClient;
  ing Newtonsoft.Json;
  ing Newtonsoft.Json.Linq;
  ing GraphQLParser;
  ing GraphQL.Builders;

  public class WellRepository : IWellRepository
  {
    public async Task<List<Well>> AllActiveWells(CancellationToken cancellationToken)
    {
      var request = new GraphQLRequest();
      request.Query = @"{
                wells (ids:[
                    ""Pu-01"",""Pu-02"",""Pu-03"",""Pu-04"",""Pu-05"",
                    ""Co-01"",""Co-02"",
                    ""Ga-01"",""Ga-02"",""Ga-03"",""Ga-04"",
                    ""Cr-01"",""Cr-02"",
                    ""Pd-01"",""Pd-02""
                ]) {
                    id
                    name
                }
                }";

      var response = await Client.GetClientInstance().PostAsync(request);
      return response.GetDataFieldAs<List<Well>>("wells");
    }
    public async Task<Metrics> WellPredictedMetrics(Well well, int date, CancellationToken cancellationToken)
    {
      var request = new GraphQLRequest();
      var variables = new { date = date, wellId = well.id };
      request.Variables = variables;

      request.Query = @"query($wellId: ID, $date:Int){
                    metricsFilter(filters: [{
                            fieldName: ""date""
                            op: ""==""
                            value: { INT: $date }
                        }
                        {
                            fieldName: ""well""
                            op: ""==""
                            value: { ID: $wellId }
                        }
                        {
                            fieldName: ""type""
                            op: ""==""
                            value: {STRING: ""predicted""
                        } 
                    }]) {
                        id
                        well {
                            id
                            name
                        }
                        date
                        type
                        waterCut
                        GOR
                        oilRate
                    }
                }";

      var response = await Client.GetClientInstance().PostAsync(request);
      var metrics = response.GetDataFieldAs<List<Metrics>>("metricsFilter");

      Metrics metric;
      if (metrics != null && metrics.Count > 0)
      {
        metric = metrics.First();
      }
      else
      {
        metric = new Metrics();
        metric.id = "1";
        metric.date = date;
        metric.well = well;
        metric.type = "predicted";
        metric.waterCut = 1;
        metric.GOR = 1;
        metric.oilRate = 1;
      }
      return metric;
    }

    public async Task<Metrics> WellMeasuredMetrics(Well well, int date, CancellationToken cancellationToken)
    {
      var request = new GraphQLRequest();
      riables = new { date = date, wellId = well.id };
    };
    request.Variables = variables;

      t.Query = @"quer@"query($wellId: ID, $date:Int)
    {
      metricsFilter(filters: [{
      fieldName: ""date""
                            op: "" == ""
                            value: { INT: $date }
      }
      {
      fieldName: ""well""
                            op: "" == ""
                            value: { ID: $wellId }
      }
      {
      fieldName: ""type""
                            op: "" == ""
                            value:
        {
        STRING: ""measured""
                        }
      }]) {
        id
        well {
          id
          name
                        }
        date
        type
                        waterCut
                        GOR
                        oilRate
                    }
    }";

var response = await Client.GetClientInstance().PostAsync(request);
    trics = response.GetDataFieldAs<List<Metrics>>("metricsFilter");

      s metric;
    trics != null && metrics.Count > 0)
      {
metric = metrics.First();
      }
      else
      {
metric = new Metrics();
  d = "1";
        ate = date;
        ell = well;
        ype = "measured";
        aterCut = 1;
        OR = 1;
        ilRate = 1;
      }
return metric;
    }

public async Task<ActionOutcome> WellActionOutcome(Well well, Models.Action action, CancellationToken cancellationToken)
{
  var request = new GraphQLRequest();
  t.Variables = new { wellI d = well.id, actionId = action.id };
};
request.Query = @" query($wellId: ID, $actionId: ID){
                actionOutcomeFilter(filters: [
                    {
                        fieldName: ""well""
                        op: ""==""
                        value: { ID: $wellId }
                    }
                    {
                        fieldName: ""action""
                        op: ""==""
                        value: { ID: $actionId }
                    }
                ]) 
                {
                    id
                    action {
                        id
                        name
                        type
                    }
                    well {
                        id
                        name
                    }
                    probabilityOfAnomaly
                    cost
                    manHours
                    increaseInOilRate
                }
            }";

      sponse = await Client.GetClientInstance().PostAsync(request);
tcomes = response.GetDataFieldAs<List<ActionOutcome>>("actionOutcomeFilter");

      Outcome actionOutcome;
tcomes != null && outcomes.Count > 0)
      {
actionOutcome = outcomes.First();
      }
      else
      {
actionOutcome = new ActionOutcome();
tcome.id = "1";
        tcome.action = action;
        tcome.well = well;
        tcome.probabilityOfAnomaly = 0;
        tcome.cost = 0;
        tcome.manHours = 0;
        tcome.increaseInOilRate = 0;
      }
return actionOutcome;
    }

public Models.Action DiscoverIntervention(Metrics predictedMetrics, Metrics measuredMetrics, CancellationToken cancellationToken)
{
  //Watercut
  var predictedWatercut = predictedMetrics.waterCut;
  asuredWatercut = measuredMetrics.waterCut;
  terCutGap = measuredWatercut - predictedWatercut;

  //OilRate
  var predictedOilRate = predictedMetrics.oilRate;
  asuredOilRate = measuredMetrics.oilRate;

  lRateGap =
    tedOilRate != 0
       * (predictedOilRate - measuredOilRate)) / predictedOilRate



      tion = new Models.Action();
      .id = "No Intervention";
      .name = "No Intervention";
      .type = "Revenue Increase";


  lRateGap > 8)
      {
    action.id = "Hydraulic Fracturing";
    ame = "Hydraulic Fracturing";
    ype = "Revenue Increase";
  }

  if (oilRateGap > 5 && oilRateGap <= 8)
  {
    action.id = "Acidizing";
    ame = "Acidizing";
    ype = "Revenue Increase";
  }

  if (waterCutGap > 7)
  {
    action.id = "Water Shutoff";
    ame = "Water Shutoff";
    ype = "Revenue Increase";
  }

  return action;
}

public Models.Action ShouldTestWell(double healthIndex, int lastTestDay, int today, CancellationToken cancellationToken)
{
  var testGap = today - lastTestDay;

  //SKIP_TEST_SAFE: anomaly prob = 0
  //SKIP_TEST_OK: anomaly prob = defined in data, per well
  //SKIP_TEST_RISKY: anomaly prob = 1
  var actionId =
          p > 60
            ? "Risky To Skip Test"
      : healthIndex >= 0.96
            ? "Safe To Skip Test"
      : healthIndex >= 0.5 && healthIndex < 0.96
            ? "OK To Skip Test"
      : "Risky To Skip Test";

  tion = new Models.Action();
      .id = actionId;
      .name = actionId;
      .type = "Cost Reduction";


  action;
}

public double HealthIndex(Metrics predictedMetrics, Metrics measuredMetrics, CancellationToken cancellationToken)
{
  //Watercut
  var predictedWatercut = predictedMetrics.waterCut;
  asuredWatercut = measuredMetrics.waterCut;
  terCutHealthIndex =
    tedWatercut != 0


            bs((predictedWatercut - measuredWatercut) / predictedWatercut)


      //GOR
  var predictedGOR = predictedMetrics.GOR;
  asuredGOR = measuredMetrics.GOR;
  RHealthIndex =
    tedGOR != 0
          Math.Abs((predictedGOR - measuredGOR) / predictedGOR)


      //OilRate
  var predictedOilRate = predictedMetrics.oilRate;
  asuredOilRate = measuredMetrics.oilRate;
  lRateHealthIndex =
    tedOilRate != 0


            bs((predictedOilRate - measuredOilRate) / predictedOilRate)



      dx = (1 / 3) * waterCutHealthIndex +
                     ) *GORHealthIndex +
                     ) *oilRateHealthIndex;

  hidx;
}

public async Task<int> WellLastTestDate(Well well, int today, CancellationToken cancellationToken)
{
  var request = new GraphQLRequest();
  t.Variables = new { wellI d = well.id };
};
request.Query = @"query($wellId: ID){
                metricsFilter(filters: [
                {
                    fieldName: ""well""
                    op: ""==""
                    value: { ID: $wellId }
                }
                {
                    fieldName: ""type""
                    op: ""==""
                    value: {STRING: ""measured""}
                }
                ]) {
                    date
                }
            }";

      sponse = await Client.GetClientInstance().PostAsync(request);
trics = response.GetDataFieldAs<List<Metrics>>("metricsFilter");
      te = 0;

      trics != null && metrics.Count > 0)
      {
var orderedMeasuredMetrics = metrics.OrderByDescending(x => x.date);
leMeasurement = orderedMeasuredMetrics.First();
        ingleMeasurement.date;
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
  var incrementalRevenueSum = revenueGains.Aggregate(0D, (accumulator, actionFinancialEstimate) =>
  {
    var impact = actionFinancialEstimate.impact;
    return accumulator + impact;
  });

  var costReductionSum = costReduction.Aggregate(0D, (accumulator, actionFinancialEstimate) =>
  {
    var impact = actionFinancialEstimate.impact;
    return accumulator + impact;
  });

  var combinedLists = costReduction.Concat(revenueGains);

  var costSum = combinedLists.Aggregate(0D, (accumulator, actionFinancialEstimate) =>
  {
    var cost = actionFinancialEstimate.cost;
    return accumulator + cost;
  });

  var manHoursSum = combinedLists.Aggregate(0D, (accumulator, actionFinancialEstimate) =>
  {
    var manHours = actionFinancialEstimate.manHours;
    return accumulator + manHours;
  });

  // TODO: Implement
  return new Opportunity
  {
    id = Guid.NewGuid().ToString(),
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

public List<ActionFinancialEstimate> InterventionRevenueGain(double oilPrice, Metrics measuredMetrics, ActionOutcome actionOutcome, CancellationToken cancellationToken)
{
  var increaseInOilRate = actionOutcome.increaseInOilRate;
  var cost = actionOutcome.cost;
  var manHours = actionOutcome.manHours;

  //oil rate is in thousand of barrels, and increase in oil rate is in percentage.
  var revenueIncrease = measuredMetrics.oilRate * oilPrice * 180000 * increaseInOilRate / 100;

  var afe = new ActionFinancialEstimate
  {
    id = Guid.NewGuid().ToString(),
    action = actionOutcome.action,
    well = actionOutcome.well,
    impact = revenueIncrease,
    cost = cost,
    manHours = manHours
  };

  return new List<ActionFinancialEstimate>() { afe };
}

public List<ActionFinancialEstimate> SkippingTestCostReduction(double oilPrice, Metrics measuredMetrics, ActionOutcome actionOutcome, CancellationToken cancellationToken)
{
  var probabilityOfAnomaly = actionOutcome.probabilityOfAnomaly / 100;
  var potentialCostOfSkippikingATest = measuredMetrics.oilRate * probabilityOfAnomaly * oilPrice * 60000;
  var costReduction = actionOutcome.cost;
  var manHours = actionOutcome.manHours;

  var afe = new ActionFinancialEstimate
  {
    id = Guid.NewGuid().ToString(),
    action = actionOutcome.action,
    well = actionOutcome.well,
    impact = costReduction,
    cost = potentialCostOfSkippikingATest,
    manHours = manHours
  };

  return new List<ActionFinancialEstimate> { afe };
}

public double CurrentOilPrice(CancellationToken cancellationToken)
{
  return 10.0F;
}
}
}
