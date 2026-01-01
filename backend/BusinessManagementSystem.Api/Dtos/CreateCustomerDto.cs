using System.ComponentModel.DataAnnotations;
using BusinessManagementSystem.Api.Models;

namespace BusinessManagementSystem.Api.Dtos;

public class CreateCustomerDto
{
    [Required]
    [MaxLength(50)]
    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Phone]
    public string PhoneNumber { get; set; } = string.Empty;

    public List<RepairJob> RepairJobs { get; set; } = new List<RepairJob>();
}