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
        public async Task<List<Well>> AllActiveWells(CancellationToken cancellationToken) {
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
        public async Task<Metrics> WellPredictedMetrics(Well well, int date, CancellationToken cancellationToken) {
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
      if (len > 0){
        // metric = filteredMetrics[0];
      }else {
          metric.id = "1";
          metric.date = date;
        //   metric.type = "predicted"; 
          metric.waterCut= 1;
          metric.GOR= 1;
          metric.oilRate= 1;
      }
      return metric;
        }
    }
}
