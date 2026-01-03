namespace BusinessManagementSystem.Api.Dtos;

public class RepairJobDto
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }

    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }

    public decimal SalePrice { get; set; }
    public decimal PartsCost { get; set; }
    public decimal Profit { get; set; }

    public string? Notes { get; set; }

    public string Status { get; set; } = "New";
    public DateTime? CompletedAt { get; set; }
    public bool IsReturnedToCustomer { get; set; }
    public DateTime? ReturnedAt { get; set; }

    public List<RepairJobItemDto> Items { get; set; } = new();
}

public class RepairJobItemDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;

    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public decimal LineCost { get; set; }
}
