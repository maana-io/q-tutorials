namespace netBox.Models
{
    using System;
    using System.Collections.Generic;

    public class Opportunity
    {
        public string id { get; set; }
        public string name { get; set; }
        public DateTime createdAt { get; set; }
        public List<Action> actions { get; set; }
        public double incrementalRevenue { get; set; }
        public double costReduction { get; set; }
        public double cost { get; set; }
        public Well well { get; set; }
        public double manHours { get; set; }

    }
}
