using System.Security.Claims;
using AuctionApi.Models;
using AuctionApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuctionApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ExcelService _excel;
    private readonly TokenService _tokens;

    public AuthController(ExcelService excel, TokenService tokens)
    {
        _excel = excel;
        _tokens = tokens;
    }

    [HttpPost("register")]
    public IActionResult Register([FromBody] RegisterRequest req)
    {
        if (_excel.GetUserByUsername(req.Username) != null)
            return BadRequest(new { message = "Username already taken." });

        if (_excel.GetUserByEmail(req.Email) != null)
            return BadRequest(new { message = "Email already registered." });

        var user = _excel.CreateUser(new User
        {
            Username = req.Username,
            Email = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            CreatedAt = DateTime.UtcNow
        });

        return Ok(new { token = _tokens.GenerateToken(user), username = user.Username, userId = user.Id });
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest req)
    {
        var user = _excel.GetUserByUsername(req.Username);
        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid credentials." });

        return Ok(new { token = _tokens.GenerateToken(user), username = user.Username, userId = user.Id });
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = _excel.GetUserById(userId);
        if (user == null) return NotFound();
        return Ok(new { userId = user.Id, username = user.Username, email = user.Email });
    }
}

public record RegisterRequest(string Username, string Email, string Password);
public record LoginRequest(string Username, string Password);
