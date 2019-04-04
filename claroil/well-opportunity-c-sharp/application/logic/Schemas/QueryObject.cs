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

      this.FieldAsync<NonNullGraphType<ListGraphType<NonNullGraphType<WellObject>>>, List<Well>>(
          "allActiveWells",
          "Get all active wells.",
          resolve: context =>
              wellRepository.AllActiveWells(
                  context.CancellationToken));

      this.FieldAsync<NonNullGraphType<MetricsObject>, Metrics>(
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

      this.FieldAsync<NonNullGraphType<MetricsObject>, Metrics>(
        "wellMeasuredMetrics",
        "Get a Well's measured metrics.",
        arguments: new QueryArguments(
          new QueryArgument<NonNullGraphType<WellObject>>()
          {
            Name = "well",
            Description = "The well for which to get the metrics.",
          },
          new QueryArgument<NonNullGraphType<IntGraphType>>()
          {
            Name = "date",
            Description = "The date of the metrics to get.",
          }
        ),
        resolve: context => wellRepository.WellMeasuredMetrics(
          context.GetArgument<Well>("well"),
          context.GetArgument<int>("date"),
          context.CancellationToken
        )
      );

      this.FieldAsync<NonNullGraphType<ActionOutcomeObject>, ActionOutcome>(
        "wellActionOutcome",
        "",
        arguments: new QueryArguments(
          new QueryArgument<NonNullGraphType<WellObject>>()
          {
            Name = "well",
            Description = "The well for which to get the metrics.",
          },
          new QueryArgument<NonNullGraphType<ActionObject>>()
          {
            Name = "action",
            Description = "",
          }
        ),
        resolve: context => wellRepository.WellActionOutcome(
          context.GetArgument<Well>("well"),
          context.GetArgument<Models.Action>("action"),
          context.CancellationToken
        )
      );

      this.FieldAsync<NonNullGraphType<ActionObject>, Models.Action>(
        "discoverIntervention",
        "",
        arguments: new QueryArguments(
          new QueryArgument<NonNullGraphType<MetricsObject>>()
          {
            Name = "predictedMetrics",
            Description = "",
          },
          new QueryArgument<NonNullGraphType<MetricsObject>>()
          {
            Name = "measuredMetrics",
            Description = "",
          }
        ),
        resolve: context => wellRepository.DiscoverIntervention(
          context.GetArgument<Metrics>("predictedMetrics"),
          context.GetArgument<Metrics>("measuredMetrics"),
          context.CancellationToken
        )
      );

      this.FieldAsync<NonNullGraphType<ActionObject>, Models.Action>(
        "shouldTestWell",
        "",
        arguments: new QueryArguments(
          new QueryArgument<NonNullGraphType<FloatGraphType>>()
          {
            Name = "healthIndex",
            Description = "",
          },
          new QueryArgument<NonNullGraphType<IntGraphType>>()
          {
            Name = "lastTestDay",
            Description = "",
          },
          new QueryArgument<NonNullGraphType<IntGraphType>>()
          {
            Name = "today",
            Description = "",
          }
        ),
        resolve: context => wellRepository.ShouldTestWell(
          context.GetArgument<float>("healthIndex"),
          context.GetArgument<int>("lastTestDay"),
          context.GetArgument<int>("today"),
          context.CancellationToken
        )
      );

      this.Field<NonNullGraphType<FloatGraphType>>(
        "healthIndex",
        "",
        arguments: new QueryArguments(
          new QueryArgument<NonNullGraphType<MetricsObject>>()
          {
            Name = "predictedMetrics",
            Description = "",
          },
          new QueryArgument<NonNullGraphType<MetricsObject>>()
          {
            Name = "measuredMetrics",
            Description = "",
          }
        ),
        resolve: context => wellRepository.HealthIndex(
          context.GetArgument<Metrics>("predictedMetrics"),
          context.GetArgument<Metrics>("measuredMetrics"),
          context.CancellationToken
        )
      );

      this.FieldAsync<NonNullGraphType<IntGraphType>, int>(
        "wellLastTestDate",
        "",
        arguments: new QueryArguments(
          new QueryArgument<NonNullGraphType<WellObject>>()
          {
            Name = "well",
            Description = "The well for which to get the metrics.",
          },
          new QueryArgument<NonNullGraphType<IntGraphType>>()
          {
            Name = "today",
            Description = "",
          }
        ),
        resolve: context => wellRepository.WellLastTestDate(
          context.GetArgument<Well>("well"),
          context.GetArgument<int>("today"),
          context.CancellationToken
        )
      );

      this.Field<NonNullGraphType<IntGraphType>>(
        "todayDate",
        "",
        resolve: context => wellRepository.TodayDate(
          context.CancellationToken
        )
      );

      this.Field<NonNullGraphType<ListGraphType<NonNullGraphType<OpportunityObject>>>>(
        "applyConstraints",
        "",
        arguments: new QueryArguments(
          new QueryArgument<NonNullGraphType<ListGraphType<NonNullGraphType<OpportunityObject>>>>()
          {
            Name = "opportunities",
            Description = "",
          },
          new QueryArgument<NonNullGraphType<ConstraintObject>>()
          {
            Name = "constraints",
            Description = "",
          }
        ),
        resolve: context => wellRepository.ApplyConstraints(
          context.GetArgument<List<Opportunity>>("opportunities"),
          context.GetArgument<Constraint>("constraints"),
          context.CancellationToken
        )
      );

      this.Field<NonNullGraphType<OpportunityObject>>(
        "combineActionImpacts",
        "",
        arguments: new QueryArguments(
          new QueryArgument<NonNullGraphType<WellObject>>()
          {
            Name = "well",
            Description = "The well for which to get the metrics.",
          },
          new QueryArgument<NonNullGraphType<ListGraphType<NonNullGraphType<ActionFinancialEstimateObject>>>>()
          {
            Name = "costReduction",
            Description = "",
          },
          new QueryArgument<NonNullGraphType<ListGraphType<NonNullGraphType<ActionFinancialEstimateObject>>>>()
          {
            Name = "revenueGains",
            Description = "",
          }
        ),
        resolve: context => wellRepository.CombineActionImpacts(
          context.GetArgument<Well>("well"),
          context.GetArgument<List<ActionFinancialEstimate>>("costReduction"),
          context.GetArgument<List<ActionFinancialEstimate>>("revenueGains"),
          context.CancellationToken
        )
      );

      this.Field<NonNullGraphType<ListGraphType<NonNullGraphType<ActionFinancialEstimateObject>>>>(
        "interventionRevenueGain",
        "",
        arguments: new QueryArguments(
          new QueryArgument<NonNullGraphType<FloatGraphType>>()
          {
            Name = "oilPrice",
            Description = "",
          },
          new QueryArgument<NonNullGraphType<MetricsObject>>()
          {
            Name = "measuredMetrics",
            Description = "",
          },
          new QueryArgument<NonNullGraphType<ActionOutcomeObject>>()
          {
            Name = "actionOutcome",
            Description = "",
          }
        ),
        resolve: context => wellRepository.InterventionRevenueGain(
          context.GetArgument<float>("oilPrice"),
          context.GetArgument<Metrics>("measuredMetrics"),
          context.GetArgument<ActionOutcome>("revenueGains"),
          context.CancellationToken
        )
      );

      this.Field<NonNullGraphType<ListGraphType<NonNullGraphType<ActionFinancialEstimateObject>>>>(
        "skippingTestCostReduction",
        "",
        arguments: new QueryArguments(
          new QueryArgument<NonNullGraphType<FloatGraphType>>()
          {
            Name = "oilPrice",
            Description = "",
          },
          new QueryArgument<NonNullGraphType<MetricsObject>>()
          {
            Name = "measuredMetrics",
            Description = "",
          },
          new QueryArgument<NonNullGraphType<ActionOutcomeObject>>()
          {
            Name = "actionOutcome",
            Description = "",
          }
        ),
        resolve: context => wellRepository.SkippingTestCostReduction(
          context.GetArgument<float>("oilPrice"),
          context.GetArgument<Metrics>("measuredMetrics"),
          context.GetArgument<ActionOutcome>("revenueGains"),
          context.CancellationToken
        )
      );

      this.Field<NonNullGraphType<FloatGraphType>>(
        "currentOilPrice",
        "",
        resolve: context => wellRepository.CurrentOilPrice(
          context.CancellationToken
        )
      );

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
