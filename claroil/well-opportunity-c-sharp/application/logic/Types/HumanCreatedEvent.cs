namespace netBox.Types
{
    using netBox.Repositories;

    public class HumanCreatedEvent : HumanObject
    {
        public HumanCreatedEvent(IHumanRepository humanRepository)
            : base(humanRepository)
        {
        }
    }
}
