using System.ComponentModel.DataAnnotations;

namespace BusinessManagementSystem.Api.Dtos;

public class CreateProductDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Range(0.01, 100000)]
    public decimal Price { get; set; }

    [Range(0, int.MaxValue)]
    public int Stock { get; set; }

    [Required]
    public int CategoryId { get; set; }
}
