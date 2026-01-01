using System.ComponentModel.DataAnnotations;

namespace BusinessManagementSystem.Api.Dtos;

public class UpdateCategoryDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;
}
