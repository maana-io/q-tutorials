namespace netBox.Models
{
    using System;

    public class Metrics
    {
        public string id { get; set; }
        public float waterCut { get; set; }
        public float GOR { get; set; }
        public float oilRate { get; set; }
        public int date { get; set; }
        public Well well { get; set; }

        public string type { get; set; }
    }
}
