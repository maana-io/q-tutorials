namespace netBox.Options
{
    using System.ComponentModel.DataAnnotations;
    using GraphQL.Server;
    using Microsoft.AspNetCore.Builder;
    using Microsoft.AspNetCore.Server.Kestrel.Core;

    /// <summary>
    /// All options for the application.
    /// </summary>
    public class ApplicationOptions
    {
        [Required]
        public CacheProfileOptions CacheProfiles { get; set; }

        [Required]
        public CompressionOptions Compression { get; set; }

        [Required]
        public ForwardedHeadersOptions ForwardedHeaders { get; set; }

        [Required]
        public GraphQLOptions GraphQL { get; set; }

        [Required]
        public KestrelServerOptions Kestrel { get; set; }
    }
}
