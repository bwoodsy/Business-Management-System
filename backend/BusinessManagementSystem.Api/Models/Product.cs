using System.ComponentModel.DataAnnotations;

namespace BusinessManagementSystem.Api.Models;

public class Product
{
    public int Id { get; set; }

    [Required]
    public string OwnerId { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Range(0.01, 100000)]
    public decimal Price { get; set; }

    [Range(0, int.MaxValue)]
    public int Stock { get; set; }

    [Required]
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
}
