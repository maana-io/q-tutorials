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
        public float incrementalRevenue { get; set; }
        public float costReduction { get; set; }
        public float cost { get; set; }
        public Well well { get; set; }
        public float manHours { get; set; }

    }
}
