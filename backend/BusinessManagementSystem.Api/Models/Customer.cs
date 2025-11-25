using System.ComponentModel.DataAnnotations;

namespace BusinessManagementSystem.Api.Models;
 
 public class Customer
 {
     public int Id { get; set; }
 
    [Required]
    [MaxLength(50)]
     public string FirstName { get; set; } = string.Empty;
    
     public string LastName { get; set; } = string.Empty;
 
    [EmailAddress]
     public string Email { get; set; } = string.Empty;
    
    [Required]
    [Phone]
     public string PhoneNumber { get; set; } = string.Empty;

     public List<RepairJob> RepairJobs { get; set; } = new();

 }