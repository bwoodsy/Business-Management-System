using System.ComponentModel.DataAnnotations;

namespace BusinessManagementSystem.Api.Models;

public class RepairJob
{
    public int Id { get; set; }

    public Product Product { get; set; } = null!;

    public string Description { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }

    public decimal TimeSpent { get; set; }

    public decimal JobCost { get; set; } 

    public decimal PartsCost { get; set; }

    public decimal labourCost { get; set; }

    public Customer Customer { get; set; } = null!;

}