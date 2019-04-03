namespace netBox.Schemas
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Boxed.AspNetCore;
    using GraphQL.Builders;
    using GraphQL.Types;
    using GraphQL.Types.Relay.DataObjects;
    using netBox.Models;
    using netBox.Repositories;
    using netBox.Types;

    /// <summary>
    /// All queries defined in the schema used to retrieve data.
    /// </summary>
    /// <example>
    /// The is an example query to get all active wells.
    /// <c>
    /// query allActiveWells {
    ///   wells
    ///   {
    ///     id
    ///     name
    ///   }
    /// }
    /// </c>
    /// </example>
    public class QueryObject : ObjectGraphType<object>
    {
        private const int MaxPageSize = 10;

        public QueryObject(
            IWellRepository wellRepository)
        {
            this.Name = "Query";
            this.Description = "The query type, represents all of the entry points into our object graph.";

            this.FieldAsync<ListGraphType<WellObject>, List<Well>>(
                "allActiveWells",
                "Get all active wells.",
                resolve: context =>
                    wellRepository.AllActiveWells(
                        context.CancellationToken));

            this.FieldAsync<MetricsObject, Metrics>(
                "wellPredictedMetrics",
                "Get a Well's predicted metrics.",
                arguments: new QueryArguments(
                    new QueryArgument<NonNullGraphType<WellObject>>()
                    {
                        Name = "well",
                        Description = "The well for which to get the metrics.",
                    }, new QueryArgument<NonNullGraphType<IntGraphType>>()
                    {
                        Name = "date",
                        Description = "The date of the metrics to get."
                    }),
                resolve: context =>
                    wellRepository.WellPredictedMetrics(
                        context.GetArgument<Well>("well"),
                        context.GetArgument<int>("date"),
                        context.CancellationToken));

            // Just include static info for info query in this case as it's not hitting the dummy repository/database.
            this.Field<InfoObject>(
                "info",
                resolve: context =>
                {
                    return new Info
                    {
                        Name = "ClarOil Well Optimization Demo",
                        Version = "0.0.5"

                    };
                });
        }
    }
}
