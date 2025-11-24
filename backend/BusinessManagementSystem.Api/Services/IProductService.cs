using BusinessManagementSystem.Api.Models;

namespace BusinessManagementSystem.Api.Services;

public interface IProductService
{
    Task<IEnumerable<Product>> GetAllAsync();
    Task<Product?> GetByIdAsync(int id);
    Task<Product> AddAsync(Product product);
    Task<bool> UpdateAsync(int id, Product updatedProduct);
    Task<bool> DeleteAsync(int id);
}
