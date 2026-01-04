using System.ComponentModel.DataAnnotations;

namespace BusinessManagementSystem.Api.Dtos;

public class UpdateRepairJobDto
{
    public int? CustomerId { get; set; }

    [Range(0.01, 1000000)]
    public decimal SalePrice { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public List<UpdateRepairJobItemDto>? Items { get; set; }
}

public class UpdateRepairJobItemDto
{
    [Range(1, int.MaxValue)]
    public int ProductId { get; set; }

    [Range(1, 100000)]
    public int Quantity { get; set; }
}
