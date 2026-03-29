using System.Security.Claims;
using AuctionApi.Models;
using AuctionApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuctionApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ItemsController : ControllerBase
{
    private readonly ExcelService _excel;

    public ItemsController(ExcelService excel) => _excel = excel;

    [HttpGet]
    public IActionResult GetAll() => Ok(_excel.GetAllItems());

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var item = _excel.GetItemById(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("{id}/winners")]
    public IActionResult GetWinners(int id)
    {
        var item = _excel.GetItemById(id);
        if (item == null) return NotFound();

        var bids = _excel.GetBidsByItemId(id);
        var allocations = ExcelService.ComputeAllocations(bids, item.Quantity);
        var clearingPrice = allocations.Any() ? allocations.Last().Amount : (decimal?)null;
        var unitsFilled = allocations.Sum(a => a.QuantityAllocated);
        var spotsAvailable = Math.Max(0, item.Quantity - unitsFilled);

        return Ok(new { clearingPrice, spotsAvailable, unitsFilled, winners = allocations });
    }

    [Authorize]
    [HttpPost]
    public IActionResult Create([FromBody] CreateItemRequest req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        if (req.EndTime <= DateTime.UtcNow)
            return BadRequest(new { message = "End time must be in the future." });

        var quantity = req.Quantity < 1 ? 1 : req.Quantity;

        var item = _excel.CreateItem(new AuctionItem
        {
            Title = req.Title,
            Description = req.Description,
            ImageUrl = req.ImageUrl ?? string.Empty,
            StartingPrice = req.StartingPrice,
            CurrentBid = req.StartingPrice,
            Quantity = quantity,
            Category = string.IsNullOrWhiteSpace(req.Category) ? "Others" : req.Category,
            EndTime = req.EndTime,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        });

        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }
}

public record CreateItemRequest(
    string Title,
    string Description,
    string? ImageUrl,
    decimal StartingPrice,
    DateTime EndTime,
    int Quantity = 1,
    string Category = "Others");
