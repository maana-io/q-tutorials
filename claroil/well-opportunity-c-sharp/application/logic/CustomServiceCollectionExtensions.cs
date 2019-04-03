namespace netBox
{
    using System;
    using System.IO.Compression;
    using System.Linq;
    using CorrelationId;
    using Boxed.AspNetCore;
    using GraphQL;
    using GraphQL.Authorization;
    using GraphQL.Server;
    using GraphQL.Server.Internal;
    using GraphQL.Validation;
    using netBox.Constants;
    using netBox.Options;
    using Microsoft.AspNetCore.Builder;
    using Microsoft.AspNetCore.Hosting;
    using Microsoft.AspNetCore.ResponseCompression;
    using Microsoft.Extensions.Configuration;
    using Microsoft.Extensions.DependencyInjection;
    using Microsoft.Extensions.Options;

    /// <summary>
    /// <see cref="IServiceCollection"/> extension methods which extend ASP.NET Core services.
    /// </summary>
    public static class CustomServiceCollectionExtensions
    {
        public static IServiceCollection AddCorrelationIdFluent(this IServiceCollection services)
        {
            services.AddCorrelationId();
            return services;
        }

        /// <summary>
        /// Configures caching for the application. Registers the <see cref="IDistributedCache"/> and
        /// <see cref="IMemoryCache"/> types with the services collection or IoC container. The
        /// <see cref="IDistributedCache"/> is intended to be used in cloud hosted scenarios where there is a shared
        /// cache, which is shared between multiple instances of the application. Use the <see cref="IMemoryCache"/>
        /// otherwise.
        /// </summary>
        public static IServiceCollection AddCustomCaching(this IServiceCollection services) =>
            services
                // Adds IMemoryCache which is a simple in-memory cache.
                .AddMemoryCache()
                // Adds IDistributedCache which is a distributed cache shared between multiple servers. This adds a
                // default implementation of IDistributedCache which is not distributed. See below:
                .AddDistributedMemoryCache();
                // Uncomment the following line to use the Redis implementation of IDistributedCache. This will
                // override any previously registered IDistributedCache service.
                // Redis is a very fast cache provider and the recommended distributed cache provider.
                // .AddDistributedRedisCache(options => { ... });
                // Uncomment the following line to use the Microsoft SQL Server implementation of IDistributedCache.
                // Note that this would require setting up the session state database.
                // Redis is the preferred cache implementation but you can use SQL Server if you don't have an alternative.
                // .AddSqlServerCache(
                //     x =>
                //     {
                //         x.ConnectionString = "Server=.;Database=ASPNET5SessionState;Trusted_Connection=True;";
                //         x.SchemaName = "dbo";
                //         x.TableName = "Sessions";
                //     });

        /// <summary>
        /// Configures the settings by binding the contents of the appsettings.json file to the specified Plain Old CLR
        /// Objects (POCO) and adding <see cref="IOptions{T}"/> objects to the services collection.
        /// </summary>
        public static IServiceCollection AddCustomOptions(
            this IServiceCollection services,
            IConfiguration configuration) =>
            services
                // ConfigureSingleton registers IOptions<T> and also T as a singleton to the services collection.
                .ConfigureAndValidateSingleton<ApplicationOptions>(configuration)
                .ConfigureAndValidateSingleton<CacheProfileOptions>(configuration.GetSection(nameof(ApplicationOptions.CacheProfiles)))
                .ConfigureAndValidateSingleton<CompressionOptions>(configuration.GetSection(nameof(ApplicationOptions.Compression)))
                .ConfigureAndValidateSingleton<ForwardedHeadersOptions>(configuration.GetSection(nameof(ApplicationOptions.ForwardedHeaders)))
                .ConfigureAndValidateSingleton<GraphQLOptions>(configuration.GetSection(nameof(ApplicationOptions.GraphQL)));

        /// <summary>
        /// Adds dynamic response compression to enable GZIP compression of responses. This is turned off for HTTPS
        /// requests by default to avoid the BREACH security vulnerability.
        /// </summary>
        public static IServiceCollection AddCustomResponseCompression(this IServiceCollection services) =>
            services
                .Configure<BrotliCompressionProviderOptions>(options => options.Level = CompressionLevel.Optimal)
                .Configure<GzipCompressionProviderOptions>(options => options.Level = CompressionLevel.Optimal)
                .AddResponseCompression(
                    options =>
                    {
                        // Add additional MIME types (other than the built in defaults) to enable GZIP compression for.
                        var customMimeTypes = services
                            .BuildServiceProvider()
                            .GetRequiredService<CompressionOptions>()
                            .MimeTypes ?? Enumerable.Empty<string>();
                        options.MimeTypes = customMimeTypes.Concat(ResponseCompressionDefaults.MimeTypes);

                        options.Providers.Add<BrotliCompressionProvider>();
                        options.Providers.Add<GzipCompressionProvider>();
                    });

        /// <summary>
        /// Add custom routing settings which determines how URL's are generated.
        /// </summary>
        public static IServiceCollection AddCustomRouting(this IServiceCollection services) =>
            services.AddRouting(
                options =>
                {
                    // All generated URL's should be lower-case.
                    options.LowercaseUrls = true;
                });

        public static IServiceCollection AddCustomHealthChecks(this IServiceCollection services) =>
            services
                .AddHealthChecks()
                // Add health checks for external dependencies here. See https://github.com/Xabaril/AspNetCore.Diagnostics.HealthChecks
                .Services;

        public static IServiceCollection AddCustomGraphQL(this IServiceCollection services, IHostingEnvironment hostingEnvironment) =>
            services
                // Add a way for GraphQL.NET to resolve types.
                .AddSingleton<IDependencyResolver, GraphQLDependencyResolver>()
                .AddGraphQL(
                    options =>
                    {
                        // Set some limits for security, read from configuration.
                        options.ComplexityConfiguration = services
                            .BuildServiceProvider()
                            .GetRequiredService<IOptions<GraphQLOptions>>()
                            .Value
                            .ComplexityConfiguration;
                        // Show stack traces in exceptions. Don't turn this on in production.
                        options.ExposeExceptions = hostingEnvironment.IsDevelopment();
                    })
                // Adds all graph types in the current assembly with a singleton lifetime.
                .AddGraphTypes()
                // Adds ConnectionType<T>, EdgeType<T> and PageInfoType.
                //.AddRelayGraphTypes()
                // Add a user context from the HttpContext and make it available in field resolvers.
                .AddUserContextBuilder<GraphQLUserContextBuilder>()
                // Add GraphQL data loader to reduce the number of calls to our repository.
                .AddDataLoader()
                // Add WebSockets support for subscriptions.
                .AddWebSockets()
                .Services
                .AddTransient(typeof(IGraphQLExecuter<>), typeof(InstrumentingGraphQLExecutor<>));


        /// <summary>
        /// Add GraphQL authorization (See https://github.com/graphql-dotnet/authorization).
        /// </summary>
        public static IServiceCollection AddCustomGraphQLAuthorization(this IServiceCollection services) 
        {
            // This registers an authorization policy to be used across the application.
            //     .AddSingleton<IAuthorizationEvaluator, AuthorizationEvaluator>()
            //     .AddTransient<IValidationRule, AuthorizationValidationRule>()
            //     .AddSingleton(
            //         x =>
            //         {
            //             var authorizationSettings = new AuthorizationSettings();
            //             authorizationSettings.AddPolicy(
            //                 AuthorizationPolicyName.Admin,
            //                 y => y.RequireClaim("role", "admin"));
            //             return authorizationSettings;
            //         });

            return services;
        }
    }
}
