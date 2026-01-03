using BusinessManagementSystem.Api.Dtos;
using BusinessManagementSystem.Api.Models;

namespace BusinessManagementSystem.Api.Mappings;

public static class RepairJobMappings
{
    public static RepairJobDto ToDto(this RepairJob job)
    {
        var partsCost = job.Items.Sum(i => i.UnitCost * i.Quantity);

        return new RepairJobDto
        {
            Id = job.Id,
            CreatedAt = job.CreatedAt,
            CustomerId = job.CustomerId,
            CustomerName = job.Customer?.FirstName,
            SalePrice = job.SalePrice,
            PartsCost = partsCost,
            Profit = job.SalePrice - partsCost,
            Notes = job.Notes,
            Status = job.Status,
            CompletedAt = job.CompletedAt,
            IsReturnedToCustomer = job.IsReturnedToCustomer,
            ReturnedAt = job.ReturnedAt,
            Items = job.Items.Select(i => new RepairJobItemDto
            {
                ProductId = i.ProductId,
                ProductName = i.Product?.Name ?? "",
                Quantity = i.Quantity,
                UnitCost = i.UnitCost,
                LineCost = i.UnitCost * i.Quantity
            }).ToList()
        };
    }
}
