namespace netBox.Models
{
    using System;

    public class Metrics
    {
        public string id { get; set; }
        public double waterCut { get; set; }
        public double GOR { get; set; }
        public double oilRate { get; set; }
        public int date { get; set; }
        public Well well { get; set; }

        public string type { get; set; }
    }
}
