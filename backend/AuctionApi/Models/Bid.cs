namespace AuctionApi.Models;

public class Bid
{
    public int Id { get; set; }
    public int ItemId { get; set; }
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int QuantityWanted { get; set; } = 1;
    public DateTime BidTime { get; set; }
}

public class WinnerAllocation
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int QuantityWanted { get; set; }
    public int QuantityAllocated { get; set; }
}
