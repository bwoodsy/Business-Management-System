using System.ComponentModel.DataAnnotations;

namespace BusinessManagementSystem.Api.Dtos;

public class UpdateRepairJobStatusDto
{
    [Required]
    public string Status { get; set; } = "New";

    public bool? IsReturnedToCustomer { get; set; }
}
