using BusinessManagementSystem.Api.Data;
using BusinessManagementSystem.Api.Dtos;
using BusinessManagementSystem.Api.Mappings;
using BusinessManagementSystem.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BusinessManagementSystem.Api.Services;

public class RepairJobService : IRepairJobService
{
    private readonly AppDbContext _context;

    public RepairJobService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<RepairJobDto> CreateAsync(CreateRepairJobDto dto)
    {
        // transaction = all-or-nothing (critical for stock changes)
        await using var tx = await _context.Database.BeginTransactionAsync();

        // Optional: validate customer exists
        if (dto.CustomerId.HasValue)
        {
            var customerExists = await _context.Customers.AnyAsync(c => c.Id == dto.CustomerId.Value);
            if (!customerExists)
                throw new InvalidOperationException($"CustomerId {dto.CustomerId.Value} does not exist.");
        }

        // Load all products used in this job
        var productIds = dto.Items.Select(i => i.ProductId).Distinct().ToList();

        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        // Validate products exist
        foreach (var pid in productIds)
        {
            if (!products.ContainsKey(pid))
                throw new InvalidOperationException($"ProductId {pid} does not exist.");
        }

        // Validate stock + decrement
        foreach (var item in dto.Items)
        {
            var product = products[item.ProductId];

            if (item.Quantity <= 0)
                throw new InvalidOperationException("Quantity must be >= 1.");

            if (product.Stock < item.Quantity)
                throw new InvalidOperationException($"Not enough stock for '{product.Name}'. Have {product.Stock}, need {item.Quantity}.");

            product.Stock -= item.Quantity;
        }

        // Create job + items (snapshot UnitCost)
        var job = new RepairJob
        {
            CustomerId = dto.CustomerId,
            SalePrice = dto.SalePrice,
            Notes = dto.Notes,
            Status = "New",
            Items = dto.Items.Select(i => new RepairJobItem
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity,
                UnitCost = products[i.ProductId].Price
            }).ToList()
        };

        _context.RepairJobs.Add(job);
        await _context.SaveChangesAsync();

        await tx.CommitAsync();

        // Load navigation for DTO response
        var created = await _context.RepairJobs
            .AsNoTracking()
            .Include(j => j.Customer)
            .Include(j => j.Items).ThenInclude(i => i.Product)
            .FirstAsync(j => j.Id == job.Id);

        return created.ToDto();
    }
}
