using BusinessManagementSystem.Api.Data;
using BusinessManagementSystem.Api.Dtos;
using BusinessManagementSystem.Api.Mappings;
using BusinessManagementSystem.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

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
        var jobs = await _context.RepairJobs
            .AsNoTracking()
            .Include(j => j.Customer)
            .Include(j => j.Items).ThenInclude(i => i.Product)
            .OrderByDescending(j => j.CreatedAt)
            .ToListAsync();

        return Ok(jobs.Select(j => j.ToDto()));
    }

    // GET: api/repairjobs/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<RepairJobDto>> GetById(int id)
    {
        var job = await _context.RepairJobs
            .AsNoTracking()
            .Include(j => j.Customer)
            .Include(j => j.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(j => j.Id == id);

        if (job == null) return NotFound();

        return Ok(job.ToDto());
    }

    // POST: api/repairjobs
    [HttpPost]
    public async Task<ActionResult<RepairJobDto>> Create(CreateRepairJobDto dto)
    {
        try
        {
            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            // clean 400 for business rule failures
            return BadRequest(new { message = ex.Message });
        }
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
