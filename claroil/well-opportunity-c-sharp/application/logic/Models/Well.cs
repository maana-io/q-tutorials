namespace netBox.Models
{
    using System;

    public class Well
    {
        public string id { get; set; }
        public string name { get; set; }
        public Metrics predictedMetrics { get; set; }
        public Metrics measuredMetrics { get; set; }
    }
}
