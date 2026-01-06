
        using BusinessManagementSystem.Api.Dtos;
        using BusinessManagementSystem.Api.Models;
        using Microsoft.AspNetCore.Authorization;
        using Microsoft.AspNetCore.Identity;
        using Microsoft.AspNetCore.Mvc;
        using Microsoft.IdentityModel.Tokens;
        using System.IdentityModel.Tokens.Jwt;
        using System.Security.Claims;
        using System.Text;

        namespace BusinessManagementSystem.Api.Controllers;

        [ApiController]
        [Route("api/[controller]")]
        public class AuthController : ControllerBase
        {
            private readonly UserManager<AppUser> _userManager;
            private readonly IConfiguration _config;
            private readonly ILogger<AuthController> _logger;

            public AuthController(UserManager<AppUser> userManager, IConfiguration config, ILogger<AuthController> logger)
            {
                _userManager = userManager;
                _config = config;
                _logger = logger;
            }

            // POST: api/auth/login
            [AllowAnonymous]
            [HttpPost("login")]
            public async Task<IActionResult> Login(LoginDto dto)
            {
                var isDesktop = string.Equals(Environment.GetEnvironmentVariable("BMS_DESKTOP"), "1", StringComparison.OrdinalIgnoreCase);

                var user = await _userManager.FindByNameAsync(dto.Username);
                if (user == null && isDesktop)
                {
                    user = new AppUser { UserName = dto.Username };
                    var created = await _userManager.CreateAsync(user, dto.Password);
                    if (!created.Succeeded)
                    {
                        var errors = string.Join("; ", created.Errors.Select(e => e.Description));
                        return BadRequest(new { errors = created.Errors.Select(e => e.Description) });
                    }
                }
                if (user == null) return Unauthorized();

                var valid = await _userManager.CheckPasswordAsync(user, dto.Password);
                if (!valid) return Unauthorized();

                var token = CreateJwtToken(user);
                if (!isDesktop)
                {
                    IssueJwtCookie(token, isDesktop);
                    return Ok(new { message = "Login successful" });
                }

                return Ok(new { message = "Login successful", token });
            }

            // POST: api/auth/register
            [AllowAnonymous]
            [HttpPost("register")]
            public async Task<IActionResult> Register([FromBody] LoginDto dto)
            {
                _logger.LogInformation($"Registration attempt: {dto.Username}");
                var isDesktop = string.Equals(Environment.GetEnvironmentVariable("BMS_DESKTOP"), "1", StringComparison.OrdinalIgnoreCase);
                
                var user = new AppUser { UserName = dto.Username };
                var result = await _userManager.CreateAsync(user, dto.Password);
                if (!result.Succeeded)
                {
                    var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                    _logger.LogWarning($"Registration failed: {errors}");
                    return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
                }

                var token = CreateJwtToken(user);
                if (!isDesktop)
                {
                    IssueJwtCookie(token, isDesktop);
                    return Ok(new { message = "Registration successful" });
                }

                return Ok(new { message = "Registration successful", token });
            }

            // POST: api/auth/logout
            [HttpPost("logout")]
            public IActionResult Logout()
            {
                Response.Cookies.Delete("jwt");
                return Ok(new { message = "Logged out" });
            }

            // GET: api/auth/me
            [HttpGet("me")]
            public IActionResult Me()
            {
                if (User.Identity?.IsAuthenticated == true)
                {
                    return Ok(new {
                        id = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
                        username = User.Identity.Name
                    });
                }
                return Unauthorized();
            }

            private string CreateJwtToken(AppUser user)
            {
                var jwt = _config.GetSection("Jwt");
                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id),
                    new Claim(ClaimTypes.Name, user.UserName ?? "")
                };
                var token = new JwtSecurityToken(
                    issuer: jwt["Issuer"],
                    audience: jwt["Audience"],
                    claims: claims,
                    expires: DateTime.UtcNow.AddHours(8),
                    signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
                );
                return new JwtSecurityTokenHandler().WriteToken(token);
            }

            private void IssueJwtCookie(string token, bool isDesktop)
            {
                Response.Cookies.Append("jwt", token, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = Request.IsHttps,
                    SameSite = isDesktop ? SameSiteMode.Lax : SameSiteMode.None,
                    Expires = DateTimeOffset.UtcNow.AddHours(8)
                });
            }
        }
