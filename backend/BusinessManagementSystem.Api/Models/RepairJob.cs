using System.ComponentModel.DataAnnotations;

namespace BusinessManagementSystem.Api.Models;

public class RepairJob
{
    public int Id { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // optional but recommended
    public int? CustomerId { get; set; }
    public Customer? Customer { get; set; }

    [Range(0.01, 1000000)]
    public decimal SalePrice { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public List<RepairJobItem> Items { get; set; } = new();
}
