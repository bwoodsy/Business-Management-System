using BusinessManagementSystem.Api.Dtos;
using BusinessManagementSystem.Api.Models;

namespace BusinessManagementSystem.Api.Mappings;

public static class ProductMappings
{
    public static ProductDto ToDto(this Product p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Price = p.Price,
        Stock = p.Stock,
        CategoryId = p.CategoryId,
        CategoryName = p.Category?.Name
    };

    public static Product ToEntity(this CreateProductDto dto) => new()
    {
        Name = dto.Name.Trim(),
        Price = dto.Price,
        Stock = dto.Stock,
        CategoryId = dto.CategoryId
    };

    public static void Apply(this UpdateProductDto dto, Product p)
    {
        p.Name = dto.Name.Trim();
        p.Price = dto.Price;
        p.Stock = dto.Stock;
        p.CategoryId = dto.CategoryId;
    }
}
