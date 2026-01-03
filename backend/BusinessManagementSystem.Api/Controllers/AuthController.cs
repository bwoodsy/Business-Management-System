    
        using BusinessManagementSystem.Api.Dtos;
        using BusinessManagementSystem.Api.Models;
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
            [HttpPost("login")]
            public async Task<IActionResult> Login(LoginDto dto)
            {
                var user = await _userManager.FindByNameAsync(dto.Username);
                if (user == null) return Unauthorized();

                var valid = await _userManager.CheckPasswordAsync(user, dto.Password);
                if (!valid) return Unauthorized();

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
                var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
                Response.Cookies.Append("jwt", tokenString, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = Request.IsHttps, // required for SameSite=None; use HTTPS locally
                    SameSite = SameSiteMode.None,
                    Expires = DateTimeOffset.UtcNow.AddHours(8)
                });
                return Ok(new { message = "Login successful" });
            }

            // POST: api/auth/register
            [HttpPost("register")]
            public async Task<IActionResult> Register([FromBody] LoginDto dto)
            {
                _logger.LogInformation($"Registration attempt: {dto.Username}");
                
                var user = new AppUser { UserName = dto.Username };
                var result = await _userManager.CreateAsync(user, dto.Password);
                if (!result.Succeeded)
                {
                    var errors = string.Join("; ", result.Errors.Select(e => e.Description));
                    _logger.LogWarning($"Registration failed: {errors}");
                    return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
                }

                // Issue JWT as in login
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
                var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
                Response.Cookies.Append("jwt", tokenString, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = Request.IsHttps, // required for SameSite=None; use HTTPS locally
                    SameSite = SameSiteMode.None,
                    Expires = DateTimeOffset.UtcNow.AddHours(8)
                });
                return Ok(new { message = "Registration successful" });
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
        }
