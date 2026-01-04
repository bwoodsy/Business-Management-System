using BusinessManagementSystem.Api.Data;
using BusinessManagementSystem.Api.Dtos;
using BusinessManagementSystem.Api.Mappings;
using BusinessManagementSystem.Api.Services;
using BusinessManagementSystem.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace BusinessManagementSystem.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RepairJobsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IRepairJobService _service;
    private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "New",
        "In Progress",
        "Waiting Parts",
        "Ready",
        "Completed"
    };

    public RepairJobsController(AppDbContext context, IRepairJobService service)
    {
        _context = context;
        _service = service;
    }

    // GET: api/repairjobs
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RepairJobDto>>> GetAll()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var jobs = await _context.RepairJobs
            .AsNoTracking()
            .Include(j => j.Customer)
            .Include(j => j.Items).ThenInclude(i => i.Product)
            .Where(j => j.Items.Any(i => i.Product.OwnerId == userId))
            .OrderByDescending(j => j.CreatedAt)
            .ToListAsync();

        return Ok(jobs.Select(j => j.ToDto()));
    }

    // GET: api/repairjobs/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<RepairJobDto>> GetById(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var job = await _context.RepairJobs
            .AsNoTracking()
            .Include(j => j.Customer)
            .Include(j => j.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(j => j.Id == id && j.Items.Any(i => i.Product.OwnerId == userId));

        if (job == null) return NotFound();

        return Ok(job.ToDto());
    }

    // POST: api/repairjobs
    [HttpPost]
    public async Task<ActionResult<RepairJobDto>> Create(CreateRepairJobDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        try
        {
            var created = await _service.CreateAsync(dto, userId);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            // clean 400 for business rule failures
            return BadRequest(new { message = ex.Message });
        }
    }

    // PUT: api/repairjobs/5
    [HttpPut("{id:int}")]
    public async Task<ActionResult<RepairJobDto>> Update(int id, UpdateRepairJobDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        await using var tx = await _context.Database.BeginTransactionAsync();

        if (dto.CustomerId.HasValue)
        {
            var customerExists = await _context.Customers.AnyAsync(c => c.Id == dto.CustomerId.Value);
            if (!customerExists)
                return BadRequest(new { message = $"CustomerId {dto.CustomerId.Value} does not exist." });
        }

        var job = await _context.RepairJobs
            .Include(j => j.Customer)
            .Include(j => j.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(j => j.Id == id && j.Items.Any(i => i.Product.OwnerId == userId));

        if (job == null) return NotFound();

        job.CustomerId = dto.CustomerId;
        job.SalePrice = dto.SalePrice;
        job.Notes = dto.Notes;

        if (dto.Items is not null)
        {
            var existingQuantities = job.Items
                .GroupBy(i => i.ProductId)
                .ToDictionary(g => g.Key, g => g.Sum(x => x.Quantity));

            var existingUnitCosts = job.Items
                .GroupBy(i => i.ProductId)
                .ToDictionary(g => g.Key, g => g.First().UnitCost);

            var incomingItems = dto.Items
                .Where(i => i.ProductId > 0 && i.Quantity > 0)
                .ToList();

            if (incomingItems.Count == 0)
                return BadRequest(new { message = "Add at least one product line item." });

            var incomingQuantities = incomingItems
                .GroupBy(i => i.ProductId)
                .ToDictionary(g => g.Key, g => g.Sum(x => x.Quantity));

            var productIds = incomingQuantities.Keys.ToList();

            var products = await _context.Products
                .Where(p => productIds.Contains(p.Id) && p.OwnerId == userId)
                .ToDictionaryAsync(p => p.Id);

            foreach (var pid in productIds)
            {
                if (!products.ContainsKey(pid))
                    return BadRequest(new { message = $"ProductId {pid} does not exist or is not accessible." });
            }

            foreach (var kvp in existingQuantities)
            {
                if (!incomingQuantities.ContainsKey(kvp.Key))
                {
                    var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == kvp.Key);
                    if (product != null)
                        product.Stock += kvp.Value;
                }
            }

            foreach (var kvp in incomingQuantities)
            {
                var oldQty = existingQuantities.TryGetValue(kvp.Key, out var existing) ? existing : 0;
                var delta = kvp.Value - oldQty;
                var product = products[kvp.Key];
                if (delta > 0)
                {
                    if (product.Stock < delta)
                        return BadRequest(new { message = $"Not enough stock for '{product.Name}'. Have {product.Stock}, need {delta}." });
                    product.Stock -= delta;
                }
                else if (delta < 0)
                {
                    product.Stock += -delta;
                }
            }

            _context.RepairJobItems.RemoveRange(job.Items);
            job.Items = incomingItems.Select(item =>
            {
                var unitCost = existingUnitCosts.TryGetValue(item.ProductId, out var cost)
                    ? cost
                    : products[item.ProductId].Price;
                return new RepairJobItem
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitCost = unitCost
                };
            }).ToList();
        }

        await _context.SaveChangesAsync();
        await tx.CommitAsync();

        var updated = await _context.RepairJobs
            .AsNoTracking()
            .Include(j => j.Customer)
            .Include(j => j.Items).ThenInclude(i => i.Product)
            .FirstAsync(j => j.Id == job.Id);

        return Ok(updated.ToDto());
    }

    // PUT: api/repairjobs/5/status
    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, UpdateRepairJobStatusDto dto)
    {
        if (!AllowedStatuses.Contains(dto.Status))
        {
            return BadRequest(new { message = "Invalid status value." });
        }

        var job = await _context.RepairJobs.FirstOrDefaultAsync(j => j.Id == id);
        if (job == null) return NotFound();

        job.Status = AllowedStatuses.First(s => s.Equals(dto.Status, StringComparison.OrdinalIgnoreCase));

        if (job.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase))
        {
            job.CompletedAt ??= DateTime.UtcNow;
        }
        else
        {
            job.CompletedAt = null;
            job.IsReturnedToCustomer = false;
            job.ReturnedAt = null;
        }

        if (dto.IsReturnedToCustomer.HasValue)
        {
            if (!job.Status.Equals("Completed", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "Returned flag can only be set when status is Completed." });
            }

            job.IsReturnedToCustomer = dto.IsReturnedToCustomer.Value;
            job.ReturnedAt = job.IsReturnedToCustomer ? DateTime.UtcNow : null;
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }
}
