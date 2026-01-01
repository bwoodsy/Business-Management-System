using System.ComponentModel.DataAnnotations;

namespace BusinessManagementSystem.Api.Dtos;

public class CreateRepairJobDto
{
    public int? CustomerId { get; set; }

    [Range(0.01, 1000000)]
    public decimal SalePrice { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    [Required]
    [MinLength(1)]
    public List<CreateRepairJobItemDto> Items { get; set; } = new();
}

public class CreateRepairJobItemDto
{
    [Required]
    public int ProductId { get; set; }

    [Range(1, 100000)]
    public int Quantity { get; set; }
}
