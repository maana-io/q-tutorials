namespace netBox.Models
{
    using System;

    public class ActionOutcome
    {
        public string id { get; set; }
        public Action action { get; set; }
        public Well well { get; set; }
        public float probabilityOfAnomaly { get; set; }
        public float cost { get; set; }
        public float manHours { get; set; }
        public float increaseInOilRate { get; set; }
    }
}
