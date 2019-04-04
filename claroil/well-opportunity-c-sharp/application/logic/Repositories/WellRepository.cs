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
            var filteredMetrics = allMetrics.FindAll(x => x.date == date && x.well.id == well.id && x.type == "predicted");
            var len = filteredMetrics.Count;
            Metrics metric;
            if (len > 0)
            {
                metric = filteredMetrics[0];
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
            var filteredMetrics = allMetrics.FindAll(x => x.date == date && x.well.id == well.id && x.type == "measured");
            var len = filteredMetrics.Count;
            Metrics metric;
            if (len > 0)
            {
                metric = filteredMetrics[0];
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
            var allActionOutcomesRequest = new GraphQLRequest();
            allActionOutcomesRequest.Query = @"{
                allActionOutcomes {
                    id
                    action {id name type}
                    well {id name}
                    probabilityOfAnomaly
                    cost
                    manHours
                    increaseInOilRate
                }
            }";

            var response = await Database.GraphQLClient.PostAsync(allActionOutcomesRequest);
            var allActionOutcomes = response.GetDataFieldAs<List<ActionOutcome>>("allActionOutcomes");
            var filteredActionOutcomes = allActionOutcomes.FindAll(x => x.action.id == action.id && x.well.id == well.id);
            var len = filteredActionOutcomes.Count;
            ActionOutcome actionOutcome;
            if (len > 0)
            {
                actionOutcome = filteredActionOutcomes[0];
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


            if (oilRateGap > 0.08)
            {
                action.id = "Hydraulic Fracturing";
                action.name = "Hydraulic Fracturing";
                action.type = "Revenue Increase";
            }

            if (oilRateGap > 0.05 && oilRateGap <= 0.08)
            {
                action.id = "Acidizing";
                action.name = "Acidizing";
                action.type = "Revenue Increase";
            }

            if (waterCutGap > 0.07)
            {
                action.id = "Water Shutoff";
                action.name = "Water Shutoff";
                action.type = "Revenue Increase";
            }

            return action;
        }

        public Models.Action ShouldTestWell(float healthIndex, int lastTestDay, int today, CancellationToken cancellationToken)
        {
            var testGap = today - lastTestDay;

            //SKIP_TEST_SAFE: anomaly prob = 0
            //SKIP_TEST_OK: anomaly prob = defined in data, per well
            //SKIP_TEST_RISKY: anomaly prob = 1
            var actionId =
              testGap > 60
                ? "Risky To Skip Test"
                : healthIndex >= 0.8
                ? "Safe To Skip Test"
                : healthIndex >= 0.5 && healthIndex < 0.8
                ? "OK To Skip Test"
                : "Risky To Skip Test";

            var action = new Models.Action();
            action.id = actionId;
            action.name = actionId;
            action.type = "Cost Reduction";


            return action;
        }

        public async Task<float> HealthIndex(Metrics predictedMetrics, Metrics measuredMetrics, CancellationToken cancellationToken)
        {
            // TODO: Implement
            return 0.0F;
        }

        public async Task<int> WellLastTestDate(Well well, int today, CancellationToken cancellationToken)
        {
            // TODO: Implement
            return 0;
        }

        public async Task<int> TodayDate(CancellationToken cancellationToken)
        {
            // TODO: Implement
            return 0;
        }

        public async Task<List<Opportunity>> ApplyConstraints(List<Opportunity> opportunities, Constraint constraints, CancellationToken cancellationToken)
        {
            // TODO: Implement
            return new List<Opportunity>();
        }

        public async Task<Opportunity> CombineActionImpacts(Well well, List<ActionFinancialEstimate> costReduction, List<ActionFinancialEstimate> revenueGains, CancellationToken cancellationToken)
        {
            // TODO: Implement
            return new Opportunity();
        }

        public async Task<List<ActionFinancialEstimate>> InterventionRevenueGain(float oilPrice, Metrics measuredMetrics, ActionOutcome actionOutcome, CancellationToken cancellationToken)
        {
            // TODO: Implement
            return new List<ActionFinancialEstimate>();
        }

        public async Task<List<ActionFinancialEstimate>> SkippingTestCostReduction(float oilPrice, Metrics measuredMetrics, ActionOutcome actionOutcome, CancellationToken cancellationToken)
        {
            // TODO: Implement
            return new List<ActionFinancialEstimate>();
        }

        public async Task<float> CurrentOilPrice(CancellationToken cancellationToken)
        {
            // TODO: Implement
            return 0.0F;
        }
    }
}
