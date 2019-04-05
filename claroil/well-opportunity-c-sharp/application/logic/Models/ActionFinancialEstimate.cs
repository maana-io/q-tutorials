namespace netBox.Models
{
    using System;

    public class ActionFinancialEstimate
    {
        public string id { get; set; }
        public Action action { get; set; }
        public Well well { get; set; }
        public double impact { get; set; }
        public double cost { get; set; }
        public double manHours { get; set; }
    }
}
