using System.ComponentModel.DataAnnotations;

namespace BusinessManagementSystem.Api.Models;

public class RepairJobItem
{
    public int Id { get; set; }

    [Required]
    public int RepairJobId { get; set; }
    public RepairJob RepairJob { get; set; } = null!;

    [Required]
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    [Range(1, 100000)]
    public int Quantity { get; set; }

    // snapshot at time of job (so later price changes don’t change past profit)
    [Range(0, 100000)]
    public decimal UnitCost { get; set; }
}
