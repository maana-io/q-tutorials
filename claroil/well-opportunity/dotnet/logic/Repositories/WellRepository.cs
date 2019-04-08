namespace netBox.Repositories
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using netBox.Models;
    using GraphQL.Common.Request;
    using Maana.AuthenticatedGraphQLClient;
    using Newtonsoft.Json;
    using Newtonsoft.Json.Linq;
    using GraphQLParser;
    using GraphQL.Builders;

    public class WellRepository : IWellRepository
    {
        private string WellMetricByDateTypeQuery = @"query($wellId: ID, $date: Int, $type: String){
                    metricsFilter(filters: [
                        {
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
                            value: { STRING: $type }
                        } 
                    ]) {
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
            var variables = new { date = date, wellId = well.id, type = "predicted" };
            request.Variables = variables;

            request.Query = WellMetricByDateTypeQuery;

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
            var variables = new { date = date, wellId = well.id, type = "measured" };
            request.Variables = variables;

            request.Query = WellMetricByDateTypeQuery;

            var response = await Client.GetClientInstance().PostAsync(request);
            Console.WriteLine(JsonConvert.SerializeObject(response));
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
                metric.type = "measured";
                metric.waterCut = 1;
                metric.GOR = 1;
                metric.oilRate = 1;
            }
            return metric;
        }

        public async Task<ActionOutcome> WellActionOutcome(Well well, Models.Action action, CancellationToken cancellationToken)
        {
            var request = new GraphQLRequest();
            request.Variables = new { wellId = well.id, actionId = action.id };
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

            var response = await Client.GetClientInstance().PostAsync(request);
            var outcomes = response.GetDataFieldAs<List<ActionOutcome>>("actionOutcomeFilter");

            ActionOutcome actionOutcome;
            if (outcomes != null && outcomes.Count > 0)
            {
                actionOutcome = outcomes.First();
            }
            else
            {
                actionOutcome = new ActionOutcome();
                actionOutcome.id = "1";
                actionOutcome.action = action;
                actionOutcome.well = well;
                actionOutcome.probabilityOfAnomaly = 0;
                actionOutcome.cost = 0;
                actionOutcome.manHours = 0;
                actionOutcome.increaseInOilRate = 0;
            }
            return actionOutcome;
        }

        public Models.Action DiscoverIntervention(Metrics predictedMetrics, Metrics measuredMetrics, CancellationToken cancellationToken)
        {
            //Watercut
            var predictedWatercut = predictedMetrics.waterCut;
            var measuredWatercut = measuredMetrics.waterCut;
            var waterCutGap = measuredWatercut - predictedWatercut;

            //OilRate
            var predictedOilRate = predictedMetrics.oilRate;
            var measuredOilRate = measuredMetrics.oilRate;

            var oilRateGap =
              predictedOilRate != 0
                ? (100 * (predictedOilRate - measuredOilRate)) / predictedOilRate
                : 0;

            var action = new Models.Action();
            action.id = "No Intervention";
            action.name = "No Intervention";
            action.type = "Revenue Increase";


            if (oilRateGap > 8)
            {
                action.id = "Hydraulic Fracturing";
                action.name = "Hydraulic Fracturing";
                action.type = "Revenue Increase";
            }

            if (oilRateGap > 5 && oilRateGap <= 8)
            {
                action.id = "Acidizing";
                action.name = "Acidizing";
                action.type = "Revenue Increase";
            }

            if (waterCutGap > 7)
            {
                action.id = "Water Shutoff";
                action.name = "Water Shutoff";
                action.type = "Revenue Increase";
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
              testGap > 60
                ? "Risky To Skip Test"
                : healthIndex >= 0.96
                ? "Safe To Skip Test"
                : healthIndex >= 0.5 && healthIndex < 0.96
                ? "OK To Skip Test"
                : "Risky To Skip Test";

            var action = new Models.Action();
            action.id = actionId;
            action.name = actionId;
            action.type = "Cost Reduction";


            return action;
        }

        public double HealthIndex(Metrics predictedMetrics, Metrics measuredMetrics, CancellationToken cancellationToken)
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
            var request = new GraphQLRequest();
            request.Variables = new { wellId = well.id, date = today };
            request.Query = @"query($wellId: ID, $date: Int){
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
                {
                    fieldName: ""date""
                    op: ""<=""
                    value: {INT: $date}
                }
                ]) {
                    date
                }
            }";

            var response = await Client.GetClientInstance().PostAsync(request);
            var metrics = response.GetDataFieldAs<List<Metrics>>("metricsFilter");
            var date = 0;

            if (metrics != null && metrics.Count > 0)
            {
                var orderedMeasuredMetrics = metrics.OrderByDescending(x => x.date);
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
            var sortedOpportunities = opportunities
            .OrderByDescending(op => op.incrementalRevenue + op.costReduction)
            .ThenBy(op => op.cost)
            .ThenBy(op => op.manHours);

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

            var costOfRevenueGains = revenueGains.Aggregate(0D, (accumulator, actionFinancialEstimate) =>
            {
                var cost = actionFinancialEstimate.cost;
                return accumulator + cost;
            });

            var potentialCostOfSkippingTests = costReduction.Aggregate(0D, (accumulator, actionFinancialEstimate) =>
            {
                var cost = actionFinancialEstimate.cost;
                return accumulator + cost;
            });

            var manHoursOfRevGains = revenueGains.Aggregate(0D, (accumulator, actionFinancialEstimate) =>
            {
                var hours = actionFinancialEstimate.manHours;
                return accumulator + hours;
            });

            if (incrementalRevenueSum - costOfRevenueGains >= 0 && costReductionSum - potentialCostOfSkippingTests > 0)
            {
                // Both revenue gain and cost Reduction
                return new Opportunity
                {
                    id = Guid.NewGuid().ToString(),
                    well = well,
                    name = "Opportunity for " + well.name,
                    createdAt = new DateTime(),
                    actions = revenueGains.Concat(costReduction).Select(x => x.action).ToList(),
                    incrementalRevenue = incrementalRevenueSum,
                    costReduction = costReductionSum - potentialCostOfSkippingTests,
                    cost = costOfRevenueGains,
                    manHours = manHoursOfRevGains
                };
            }
            else if (incrementalRevenueSum - costOfRevenueGains >= 0)
            {
                // Only revenue gains
                return new Opportunity
                {
                    id = Guid.NewGuid().ToString(),
                    well = well,
                    name = "Opportunity for " + well.name,
                    createdAt = new DateTime(),
                    actions = revenueGains.Select(x => x.action).ToList(),
                    incrementalRevenue = incrementalRevenueSum,
                    costReduction = 0,
                    cost = costOfRevenueGains,
                    manHours = manHoursOfRevGains
                };
            }
            else
            {
                // Only cost reduction? Unreachable, always has a no-intervention gain of 0!
                return new Opportunity
                {
                    id = Guid.NewGuid().ToString(),
                    well = well,
                    name = "Opportunity for " + well.name,
                    createdAt = new DateTime(),
                    actions = costReduction.Select(x => x.action).ToList(),
                    incrementalRevenue = 0,
                    costReduction = costReductionSum - potentialCostOfSkippingTests,
                    cost = 0,
                    manHours = 0
                };

            }
        }

        public List<ActionFinancialEstimate> InterventionRevenueGain(double oilPrice, Metrics measuredMetrics, ActionOutcome actionOutcome, CancellationToken cancellationToken)
        {
            var increaseInOilRate = actionOutcome.increaseInOilRate;
            var cost = actionOutcome.cost;
            var manHours = actionOutcome.manHours;

            // Oil rate is in thousand of barrels, and increase in oil rate is in percentage.
            var revenueIncrease = measuredMetrics.oilRate * oilPrice * 180000 * (increaseInOilRate / 100);

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
