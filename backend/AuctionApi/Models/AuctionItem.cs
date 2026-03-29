namespace AuctionApi.Models;

public class AuctionItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public decimal StartingPrice { get; set; }
    public decimal CurrentBid { get; set; }
    public int? CurrentBidderId { get; set; }
    public string CurrentBidderName { get; set; } = string.Empty;
    public DateTime EndTime { get; set; }
    public int CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public int Quantity { get; set; } = 1;
    public string Category { get; set; } = "Others";
    public bool IsActive => DateTime.UtcNow < DateTime.SpecifyKind(EndTime, DateTimeKind.Utc);
}
