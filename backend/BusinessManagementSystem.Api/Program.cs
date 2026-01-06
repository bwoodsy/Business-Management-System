using BusinessManagementSystem.Api.Data;
using BusinessManagementSystem.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using BusinessManagementSystem.Api.Models;
using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=business.db";
var dbPath = Environment.GetEnvironmentVariable("BMS_DB_PATH");
if (!string.IsNullOrWhiteSpace(dbPath))
{
    var directory = Path.GetDirectoryName(dbPath);
    if (!string.IsNullOrWhiteSpace(directory))
    {
        Directory.CreateDirectory(directory);
    }
    connectionString = $"Data Source={dbPath}";
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(connectionString));

builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IRepairJobService, RepairJobService>();

builder.Services
    .AddIdentityCore<AppUser>(options =>
    {
        // Relax password requirements for development
        options.Password.RequiredLength = 6;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireDigit = false;
    })
    .AddEntityFrameworkStores<AppDbContext>();

// Read JWT config section for Issuer/Audience
var jwt = builder.Configuration.GetSection("Jwt");
// Read JWT key from environment variable first (highest priority), then appsettings
var jwtKey = Environment.GetEnvironmentVariable("Jwt__Key")
    ?? jwt["Key"]
    ?? string.Empty;

if (jwtKey.Length < 32)
{
    var allowDesktopFallback =
        builder.Environment.IsDevelopment() ||
        string.Equals(Environment.GetEnvironmentVariable("BMS_DESKTOP"), "1", StringComparison.OrdinalIgnoreCase);
    if (allowDesktopFallback)
    {
        jwtKey = "bms_desktop_local_key_please_change_32chars_min_0001";
    }
    else
    {
        throw new InvalidOperationException("Jwt:Key must be at least 32 characters. Set the Jwt__Key environment variable for deployment.");
    }
}
// CRITICAL: Set the key in configuration so AuthController reads the same value
builder.Configuration["Jwt:Key"] = jwtKey;
try
{
    var jwtLogDbPath = Environment.GetEnvironmentVariable("BMS_DB_PATH");
    var logDir = !string.IsNullOrWhiteSpace(jwtLogDbPath) ? Path.GetDirectoryName(jwtLogDbPath) : AppContext.BaseDirectory;
    if (!string.IsNullOrWhiteSpace(logDir))
    {
        Directory.CreateDirectory(logDir);
        var logPath = Path.Combine(logDir, "jwt-debug.txt");
        var envKey = Environment.GetEnvironmentVariable("Jwt__Key");
        var configKey = builder.Configuration.GetSection("Jwt")["Key"];
        File.WriteAllText(logPath, string.Join(Environment.NewLine, new[]
        {
            $"timestamp={DateTime.UtcNow:O}",
            $"jwtKeyLength={jwtKey.Length}",
            $"jwtKeyPrefix={jwtKey.Substring(0, Math.Min(10, jwtKey.Length))}...",
            $"envKeyLength={envKey?.Length ?? 0}",
            $"configKeyLength={configKey?.Length ?? 0}",
            $"appBaseDir={AppContext.BaseDirectory}",
            $"bmsDesktop={Environment.GetEnvironmentVariable("BMS_DESKTOP")}",
            ""
        }));
    }
}
catch
{
    // Ignore logging failures to avoid blocking startup.
}
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (string.IsNullOrWhiteSpace(context.Token) &&
                    context.Request.Cookies.TryGetValue("jwt", out var token) &&
                    !string.IsNullOrWhiteSpace(token))
                {
                    context.Token = token;
                }
                return Task.CompletedTask;
            }
        };
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = key
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrWhiteSpace(origin) || origin == "null")
                {
                    return true;
                }

                if (Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                {
                    var isHttp = uri.Scheme == "http" || uri.Scheme == "https";
                    var isLocalhost = string.Equals(uri.Host, "localhost", StringComparison.OrdinalIgnoreCase)
                        || string.Equals(uri.Host, "127.0.0.1", StringComparison.OrdinalIgnoreCase);
                    return isHttp && isLocalhost;
                }

                return false;
            })
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});


var app = builder.Build();

app.UseCors("FrontendDev");

using (var scope = app.Services.CreateScope())
{
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    await db.Database.MigrateAsync();

    var adminUser = "admin";
    var adminPass = "ChangeMe123!";

    var existing = await userManager.FindByNameAsync(adminUser);
    if (existing == null)
    {
        var user = new AppUser { UserName = adminUser };
        await userManager.CreateAsync(user, adminPass);
    }

    var jobsNeedingStatus = await db.RepairJobs
        .Where(job => job.Status == null || job.Status == string.Empty)
        .ToListAsync();

    if (jobsNeedingStatus.Count > 0)
    {
        foreach (var job in jobsNeedingStatus)
        {
            job.Status = "New";
        }

        await db.SaveChangesAsync();
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Only use HTTPS redirection when not in desktop mode (desktop uses HTTP locally)
var isDesktopMode = string.Equals(Environment.GetEnvironmentVariable("BMS_DESKTOP"), "1", StringComparison.OrdinalIgnoreCase);
if (!isDesktopMode)
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
