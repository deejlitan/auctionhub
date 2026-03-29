using System.Security.Claims;
using AuctionApi.Models;
using AuctionApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuctionApi.Controllers;

[ApiController]
[Route("api/items/{itemId}/bids")]
public class BidsController : ControllerBase
{
    private readonly ExcelService _excel;

    public BidsController(ExcelService excel) => _excel = excel;

    [HttpGet]
    public IActionResult GetBids(int itemId)
    {
        var item = _excel.GetItemById(itemId);
        if (item == null) return NotFound();
        return Ok(_excel.GetBidsByItemId(itemId));
    }

    [Authorize]
    [HttpPost]
    public IActionResult PlaceBid(int itemId, [FromBody] PlaceBidRequest req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var username = User.FindFirstValue(ClaimTypes.Name)!;

        var item = _excel.GetItemById(itemId);
        if (item == null) return NotFound(new { message = "Item not found." });

        if (!item.IsActive)
            return BadRequest(new { message = "This auction has ended." });

        if (item.CreatedByUserId == userId)
            return BadRequest(new { message = "You cannot bid on your own auction." });

        if (item.Quantity == 1)
        {
            // Standard single-winner auction
            if (item.CurrentBidderId == userId)
                return BadRequest(new { message = "You are already the highest bidder." });

            if (req.Amount <= item.CurrentBid)
                return BadRequest(new { message = $"Bid must be higher than current bid of ₱{item.CurrentBid:N2}." });

            var bid = _excel.CreateBid(new Bid
            {
                ItemId = itemId, UserId = userId, Username = username,
                Amount = req.Amount, BidTime = DateTime.UtcNow
            });

            item.CurrentBid = req.Amount;
            item.CurrentBidderId = userId;
            item.CurrentBidderName = username;
            _excel.UpdateItem(item);
            return Ok(bid);
        }
        else
        {
            // Uniform price auction — top N bidders all win at clearing price
            if (req.Amount < item.StartingPrice)
                return BadRequest(new { message = $"Bid must be at least the starting price of ₱{item.StartingPrice:N2}." });

            int qtyWanted = req.QuantityWanted < 1 ? 1 : req.QuantityWanted;
            if (qtyWanted > item.Quantity)
                return BadRequest(new { message = $"You cannot request more than {item.Quantity} units." });

            var bid = _excel.UpsertBid(new Bid
            {
                ItemId = itemId, UserId = userId, Username = username,
                Amount = req.Amount, QuantityWanted = qtyWanted, BidTime = DateTime.UtcNow
            });

            // Recompute clearing price
            var allBids = _excel.GetBidsByItemId(itemId);
            var clearingPrice = ExcelService.GetClearingPrice(allBids, item.Quantity);
            if (clearingPrice.HasValue)
            {
                item.CurrentBid = clearingPrice.Value;
                _excel.UpdateItem(item);
            }

            return Ok(bid);
        }
    }
}

public record PlaceBidRequest(decimal Amount, int QuantityWanted = 1);
