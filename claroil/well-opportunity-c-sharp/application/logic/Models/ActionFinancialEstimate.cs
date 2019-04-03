namespace netBox.Models
{
    using System;

    public class ActionFinancialEstimate
    {
        public string id { get; set; }
        public Action action { get; set; }
        public Well well { get; set; }
        public float impact { get; set; }
        public float cost { get; set; }
        public float manHours { get; set; }
    }
}
