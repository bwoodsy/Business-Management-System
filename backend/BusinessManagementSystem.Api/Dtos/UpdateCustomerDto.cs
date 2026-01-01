using System.ComponentModel.DataAnnotations;
using BusinessManagementSystem.Api.Models;

namespace BusinessManagementSystem.Api.Dtos;

public class UpdateCustomerDto
{
    [Required, MaxLength(60)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(25)]
    public string? Phone { get; set; }

    [MaxLength(120)]
    public string? Email { get; set; }

    public List<RepairJob> RepairJobs { get; set; } = new List<RepairJob>();
}