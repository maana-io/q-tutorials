namespace netBox.Models
{
    using System;

    public class ActionOutcome
    {
        public string id { get; set; }
        public Action action { get; set; }
        public Well well { get; set; }
        public double probabilityOfAnomaly { get; set; }
        public double cost { get; set; }
        public double manHours { get; set; }
        public double increaseInOilRate { get; set; }
    }
}
