using BusinessManagementSystem.Api.Dtos;
using BusinessManagementSystem.Api.Models;

namespace BusinessManagementSystem.Api.Mappings;

public static class CategoryMappings
{
    public static CategoryDto ToDto(this Category c) => new()
    {
        Id = c.Id,
        Name = c.Name
    };

    public static Category ToEntity(this CreateCategoryDto dto) => new()
    {
        Name = dto.Name.Trim()
    };

    public static void Apply(this UpdateCategoryDto dto, Category c)
    {
        c.Name = dto.Name.Trim();
    }
}
