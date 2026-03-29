using ClosedXML.Excel;
using AuctionApi.Models;

namespace AuctionApi.Services;

public class ExcelService
{
    private readonly string _filePath;
    private readonly object _lock = new();

    public ExcelService(IConfiguration config)
    {
        var dataDir = config["DataDirectory"] ?? Path.Combine(Directory.GetCurrentDirectory(), "Data");
        Directory.CreateDirectory(dataDir);
        _filePath = Path.Combine(dataDir, "auction.xlsx");
        EnsureFileExists();
    }

    private XLWorkbook OpenWorkbook()
    {
        var bytes = File.ReadAllBytes(_filePath);
        return new XLWorkbook(new MemoryStream(bytes));
    }

    private void SaveWorkbook(XLWorkbook wb)
    {
        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        File.WriteAllBytes(_filePath, ms.ToArray());
    }

    private void EnsureFileExists()
    {
        if (File.Exists(_filePath)) return;

        using var wb = new XLWorkbook();

        var users = wb.AddWorksheet("Users");
        users.Cell(1, 1).Value = "Id";
        users.Cell(1, 2).Value = "Username";
        users.Cell(1, 3).Value = "Email";
        users.Cell(1, 4).Value = "PasswordHash";
        users.Cell(1, 5).Value = "CreatedAt";

        var items = wb.AddWorksheet("Items");
        items.Cell(1, 1).Value = "Id";
        items.Cell(1, 2).Value = "Title";
        items.Cell(1, 3).Value = "Description";
        items.Cell(1, 4).Value = "ImageUrl";
        items.Cell(1, 5).Value = "StartingPrice";
        items.Cell(1, 6).Value = "CurrentBid";
        items.Cell(1, 7).Value = "CurrentBidderId";
        items.Cell(1, 8).Value = "CurrentBidderName";
        items.Cell(1, 9).Value = "EndTime";
        items.Cell(1, 10).Value = "CreatedByUserId";
        items.Cell(1, 11).Value = "CreatedAt";
        items.Cell(1, 12).Value = "Quantity";
        items.Cell(1, 13).Value = "Category";

        var bids = wb.AddWorksheet("Bids");
        bids.Cell(1, 1).Value = "Id";
        bids.Cell(1, 2).Value = "ItemId";
        bids.Cell(1, 3).Value = "UserId";
        bids.Cell(1, 4).Value = "Username";
        bids.Cell(1, 5).Value = "Amount";
        bids.Cell(1, 6).Value = "BidTime";
        bids.Cell(1, 7).Value = "QuantityWanted";

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        File.WriteAllBytes(_filePath, ms.ToArray());

        SeedSampleData();
    }

    // ── Clearing price + winner allocation ────────────────────────────────

    public static List<WinnerAllocation> ComputeAllocations(List<Bid> bids, int totalQuantity)
    {
        // Best bid per user, sorted highest first
        var ranked = bids
            .GroupBy(b => b.UserId)
            .Select(g => g.OrderByDescending(b => b.Amount).First())
            .OrderByDescending(b => b.Amount)
            .ToList();

        var allocations = new List<WinnerAllocation>();
        int remaining = totalQuantity;

        foreach (var bid in ranked)
        {
            if (remaining <= 0) break;
            int allocated = Math.Min(bid.QuantityWanted, remaining);
            allocations.Add(new WinnerAllocation
            {
                UserId = bid.UserId,
                Username = bid.Username,
                Amount = bid.Amount,
                QuantityWanted = bid.QuantityWanted,
                QuantityAllocated = allocated
            });
            remaining -= allocated;
        }

        return allocations;
    }

    public static decimal? GetClearingPrice(List<Bid> bids, int totalQuantity)
    {
        var allocations = ComputeAllocations(bids, totalQuantity);
        return allocations.Any() ? allocations.Last().Amount : null;
    }

    // ── Seed data ──────────────────────────────────────────────────────────

    public void SeedSampleData()
    {
        var now = DateTime.UtcNow;

        var alice = CreateUser(new User { Username = "alice", Email = "alice@example.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"), CreatedAt = now });
        var bob = CreateUser(new User { Username = "bob", Email = "bob@example.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"), CreatedAt = now });
        var carol = CreateUser(new User { Username = "carol", Email = "carol@example.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"), CreatedAt = now });

        // Standard single-winner auctions
        var item1 = CreateItem(new AuctionItem
        {
            Title = "Dell Latitude E7470 Laptop",
            Description = "Used Dell Latitude E7470, Intel Core i5-6300U, 8GB RAM, 256GB SSD, 14\" FHD display. Good condition, minor scratches on lid.",
            ImageUrl = "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600",
            StartingPrice = 8000, CurrentBid = 11500, CurrentBidderId = bob.Id, CurrentBidderName = bob.Username,
            Quantity = 1, Category = "Computers", EndTime = now.AddDays(2), CreatedByUserId = alice.Id, CreatedAt = now.AddDays(-1)
        });

        var item2 = CreateItem(new AuctionItem
        {
            Title = "Cisco Catalyst 2960 24-Port Switch",
            Description = "Used Cisco Catalyst 2960 series 24-port managed switch. Fully functional, tested. Ideal for small office networks.",
            ImageUrl = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
            StartingPrice = 5000, CurrentBid = 6800, CurrentBidderId = carol.Id, CurrentBidderName = carol.Username,
            Quantity = 1, Category = "Networking", EndTime = now.AddHours(18), CreatedByUserId = bob.Id, CreatedAt = now.AddDays(-2)
        });

        var item3 = CreateItem(new AuctionItem
        {
            Title = "Samsung 27\" FHD Monitor (S27F350)",
            Description = "Samsung 27-inch Full HD LED monitor, 1920x1080, HDMI & VGA ports. No dead pixels. Minor stand scuffs.",
            ImageUrl = "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600",
            StartingPrice = 3500, CurrentBid = 3500,
            Quantity = 1, Category = "Peripherals", EndTime = now.AddDays(5), CreatedByUserId = carol.Id, CreatedAt = now.AddHours(-3)
        });

        var item4 = CreateItem(new AuctionItem
        {
            Title = "HP ProDesk 600 G2 Desktop PC",
            Description = "HP ProDesk 600 G2, Intel Core i5-6500, 16GB RAM, 500GB HDD. Windows 10 Pro installed. Good working condition.",
            ImageUrl = "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=600",
            StartingPrice = 7000, CurrentBid = 9200, CurrentBidderId = alice.Id, CurrentBidderName = alice.Username,
            Quantity = 1, Category = "Computers", EndTime = now.AddDays(3), CreatedByUserId = bob.Id, CreatedAt = now.AddDays(-3)
        });

        // Uniform price auction — 3 units
        var item5 = CreateItem(new AuctionItem
        {
            Title = "Seagate 1TB External Hard Drive (3 Units)",
            Description = "Lot of 3 Seagate 1TB USB 3.0 external hard drives. All tested and working. Top 3 bidders win — everyone pays the same clearing price.",
            ImageUrl = "https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=600",
            StartingPrice = 1500, CurrentBid = 1800, Quantity = 3, Category = "Storage", EndTime = now.AddDays(4), CreatedByUserId = alice.Id, CreatedAt = now.AddHours(-2)
        });

        // Ended auction
        var item6 = CreateItem(new AuctionItem
        {
            Title = "iPhone 11 64GB (Used)",
            Description = "Used Apple iPhone 11 64GB in Black. Battery health 83%. Minor scratches on screen. Comes with original charger.",
            ImageUrl = "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600",
            StartingPrice = 8000, CurrentBid = 12500,
            CurrentBidderId = carol.Id, CurrentBidderName = carol.Username,
            Quantity = 1, Category = "Mobile & Tablets", EndTime = now.AddDays(-1), CreatedByUserId = alice.Id, CreatedAt = now.AddDays(-5)
        });

        // Bids for single-winner items
        CreateBid(new Bid { ItemId = item1.Id, UserId = carol.Id, Username = carol.Username, Amount = 9000, BidTime = now.AddHours(-20) });
        CreateBid(new Bid { ItemId = item1.Id, UserId = bob.Id, Username = bob.Username, Amount = 10000, BidTime = now.AddHours(-18) });
        CreateBid(new Bid { ItemId = item1.Id, UserId = carol.Id, Username = carol.Username, Amount = 10800, BidTime = now.AddHours(-10) });
        CreateBid(new Bid { ItemId = item1.Id, UserId = bob.Id, Username = bob.Username, Amount = 11500, BidTime = now.AddHours(-2) });

        CreateBid(new Bid { ItemId = item2.Id, UserId = alice.Id, Username = alice.Username, Amount = 5500, BidTime = now.AddHours(-30) });
        CreateBid(new Bid { ItemId = item2.Id, UserId = carol.Id, Username = carol.Username, Amount = 6800, BidTime = now.AddHours(-5) });

        CreateBid(new Bid { ItemId = item4.Id, UserId = carol.Id, Username = carol.Username, Amount = 7500, BidTime = now.AddDays(-2) });
        CreateBid(new Bid { ItemId = item4.Id, UserId = alice.Id, Username = alice.Username, Amount = 9200, BidTime = now.AddHours(-12) });

        CreateBid(new Bid { ItemId = item6.Id, UserId = alice.Id, Username = alice.Username, Amount = 9000, BidTime = now.AddDays(-4) });
        CreateBid(new Bid { ItemId = item6.Id, UserId = bob.Id, Username = bob.Username, Amount = 10500, BidTime = now.AddDays(-3) });
        CreateBid(new Bid { ItemId = item6.Id, UserId = carol.Id, Username = carol.Username, Amount = 12500, BidTime = now.AddHours(-8) });

        // Bids for uniform price auction (one per user)
        UpsertBid(new Bid { ItemId = item5.Id, UserId = alice.Id, Username = alice.Username, Amount = 1800, QuantityWanted = 2, BidTime = now.AddHours(-1) });
        UpsertBid(new Bid { ItemId = item5.Id, UserId = bob.Id, Username = bob.Username, Amount = 1600, QuantityWanted = 1, BidTime = now.AddHours(-1) });
    }

    // ── Users ──────────────────────────────────────────────────────────────

    public List<User> GetAllUsers()
    {
        lock (_lock)
        {
            using var wb = OpenWorkbook();
            var ws = wb.Worksheet("Users");
            var users = new List<User>();
            var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;
            for (int r = 2; r <= lastRow; r++)
            {
                var row = ws.Row(r);
                if (row.Cell(1).IsEmpty()) continue;
                users.Add(new User
                {
                    Id = row.Cell(1).GetValue<int>(),
                    Username = row.Cell(2).GetString(),
                    Email = row.Cell(3).GetString(),
                    PasswordHash = row.Cell(4).GetString(),
                    CreatedAt = row.Cell(5).GetValue<DateTime>()
                });
            }
            return users;
        }
    }

    public User? GetUserById(int id) => GetAllUsers().FirstOrDefault(u => u.Id == id);
    public User? GetUserByUsername(string username) =>
        GetAllUsers().FirstOrDefault(u => u.Username.Equals(username, StringComparison.OrdinalIgnoreCase));
    public User? GetUserByEmail(string email) =>
        GetAllUsers().FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));

    public User CreateUser(User user)
    {
        lock (_lock)
        {
            using var wb = OpenWorkbook();
            var ws = wb.Worksheet("Users");
            var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;
            user.Id = lastRow == 1 ? 1 : ws.Row(lastRow).Cell(1).GetValue<int>() + 1;
            int newRow = lastRow + 1;
            ws.Cell(newRow, 1).Value = user.Id;
            ws.Cell(newRow, 2).Value = user.Username;
            ws.Cell(newRow, 3).Value = user.Email;
            ws.Cell(newRow, 4).Value = user.PasswordHash;
            ws.Cell(newRow, 5).Value = user.CreatedAt;
            SaveWorkbook(wb);
            return user;
        }
    }

    // ── Items ──────────────────────────────────────────────────────────────

    public List<AuctionItem> GetAllItems()
    {
        lock (_lock)
        {
            using var wb = OpenWorkbook();
            var ws = wb.Worksheet("Items");
            var items = new List<AuctionItem>();
            var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;
            for (int r = 2; r <= lastRow; r++)
            {
                var row = ws.Row(r);
                if (row.Cell(1).IsEmpty()) continue;
                items.Add(MapRowToItem(row));
            }
            return items;
        }
    }

    public AuctionItem? GetItemById(int id) => GetAllItems().FirstOrDefault(i => i.Id == id);

    public AuctionItem CreateItem(AuctionItem item)
    {
        lock (_lock)
        {
            using var wb = OpenWorkbook();
            var ws = wb.Worksheet("Items");
            var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;
            item.Id = lastRow == 1 ? 1 : ws.Row(lastRow).Cell(1).GetValue<int>() + 1;
            WriteItemRow(ws, lastRow + 1, item);
            SaveWorkbook(wb);
            return item;
        }
    }

    public void UpdateItem(AuctionItem item)
    {
        lock (_lock)
        {
            using var wb = OpenWorkbook();
            var ws = wb.Worksheet("Items");
            var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;
            for (int r = 2; r <= lastRow; r++)
            {
                if (ws.Row(r).Cell(1).GetValue<int>() == item.Id)
                {
                    WriteItemRow(ws, r, item);
                    SaveWorkbook(wb);
                    return;
                }
            }
        }
    }

    private static AuctionItem MapRowToItem(IXLRow row) => new()
    {
        Id = row.Cell(1).GetValue<int>(),
        Title = row.Cell(2).GetString(),
        Description = row.Cell(3).GetString(),
        ImageUrl = row.Cell(4).GetString(),
        StartingPrice = row.Cell(5).GetValue<decimal>(),
        CurrentBid = row.Cell(6).GetValue<decimal>(),
        CurrentBidderId = row.Cell(7).IsEmpty() ? null : row.Cell(7).GetValue<int?>(),
        CurrentBidderName = row.Cell(8).GetString(),
        EndTime = row.Cell(9).GetValue<DateTime>(),
        CreatedByUserId = row.Cell(10).GetValue<int>(),
        CreatedAt = row.Cell(11).GetValue<DateTime>(),
        Quantity = row.Cell(12).IsEmpty() ? 1 : row.Cell(12).GetValue<int>(),
        Category = row.Cell(13).IsEmpty() ? "Others" : row.Cell(13).GetString()
    };

    private static void WriteItemRow(IXLWorksheet ws, int rowNum, AuctionItem item)
    {
        ws.Cell(rowNum, 1).Value = item.Id;
        ws.Cell(rowNum, 2).Value = item.Title;
        ws.Cell(rowNum, 3).Value = item.Description;
        ws.Cell(rowNum, 4).Value = item.ImageUrl;
        ws.Cell(rowNum, 5).Value = item.StartingPrice;
        ws.Cell(rowNum, 6).Value = item.CurrentBid;
        if (item.CurrentBidderId.HasValue)
            ws.Cell(rowNum, 7).Value = item.CurrentBidderId.Value;
        else
            ws.Cell(rowNum, 7).Clear();
        ws.Cell(rowNum, 8).Value = item.CurrentBidderName;
        ws.Cell(rowNum, 9).Value = item.EndTime;
        ws.Cell(rowNum, 10).Value = item.CreatedByUserId;
        ws.Cell(rowNum, 11).Value = item.CreatedAt;
        ws.Cell(rowNum, 12).Value = item.Quantity;
        ws.Cell(rowNum, 13).Value = item.Category;
    }

    // ── Bids ───────────────────────────────────────────────────────────────

    public List<Bid> GetBidsByItemId(int itemId)
    {
        lock (_lock)
        {
            using var wb = OpenWorkbook();
            var ws = wb.Worksheet("Bids");
            var bids = new List<Bid>();
            var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;
            for (int r = 2; r <= lastRow; r++)
            {
                var row = ws.Row(r);
                if (row.Cell(1).IsEmpty()) continue;
                if (row.Cell(2).GetValue<int>() == itemId)
                {
                    bids.Add(new Bid
                    {
                        Id = row.Cell(1).GetValue<int>(),
                        ItemId = row.Cell(2).GetValue<int>(),
                        UserId = row.Cell(3).GetValue<int>(),
                        Username = row.Cell(4).GetString(),
                        Amount = row.Cell(5).GetValue<decimal>(),
                        BidTime = row.Cell(6).GetValue<DateTime>(),
                        QuantityWanted = row.Cell(7).IsEmpty() ? 1 : row.Cell(7).GetValue<int>()
                    });
                }
            }
            return bids.OrderByDescending(b => b.Amount).ToList();
        }
    }

    // Standard bid — always appends (used for single-winner auctions)
    public Bid CreateBid(Bid bid)
    {
        lock (_lock)
        {
            using var wb = OpenWorkbook();
            var ws = wb.Worksheet("Bids");
            var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;
            bid.Id = lastRow == 1 ? 1 : ws.Row(lastRow).Cell(1).GetValue<int>() + 1;
            WriteBidRow(ws, lastRow + 1, bid);
            SaveWorkbook(wb);
            return bid;
        }
    }

    // Upsert bid — one bid per user per item (used for uniform price auctions)
    public Bid UpsertBid(Bid bid)
    {
        lock (_lock)
        {
            using var wb = OpenWorkbook();
            var ws = wb.Worksheet("Bids");
            var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;

            for (int r = 2; r <= lastRow; r++)
            {
                var row = ws.Row(r);
                if (row.Cell(1).IsEmpty()) continue;
                if (row.Cell(2).GetValue<int>() == bid.ItemId &&
                    row.Cell(3).GetValue<int>() == bid.UserId)
                {
                    bid.Id = row.Cell(1).GetValue<int>();
                    ws.Cell(r, 5).Value = bid.Amount;
                    ws.Cell(r, 6).Value = bid.BidTime;
                    ws.Cell(r, 7).Value = bid.QuantityWanted;
                    SaveWorkbook(wb);
                    return bid;
                }
            }

            bid.Id = lastRow == 1 ? 1 : ws.Row(lastRow).Cell(1).GetValue<int>() + 1;
            WriteBidRow(ws, lastRow + 1, bid);
            SaveWorkbook(wb);
            return bid;
        }
    }

    private static void WriteBidRow(IXLWorksheet ws, int rowNum, Bid bid)
    {
        ws.Cell(rowNum, 1).Value = bid.Id;
        ws.Cell(rowNum, 2).Value = bid.ItemId;
        ws.Cell(rowNum, 3).Value = bid.UserId;
        ws.Cell(rowNum, 4).Value = bid.Username;
        ws.Cell(rowNum, 5).Value = bid.Amount;
        ws.Cell(rowNum, 6).Value = bid.BidTime;
        ws.Cell(rowNum, 7).Value = bid.QuantityWanted;
    }
}
