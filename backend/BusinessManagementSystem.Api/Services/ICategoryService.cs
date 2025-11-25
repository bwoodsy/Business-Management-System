using BusinessManagementSystem.Api.Models;

namespace BusinessManagementSystem.Api.Services;

public interface ICategoryService
{
    Task<IEnumerable<Category>> GetAllAsync();
    Task<Category?> GetByIdAsync(int id);
    Task<Category> AddAsync(Category category);
    Task<bool> UpdateAsync(int id, Category updatedCategory);
    Task<bool> DeleteAsync(int id);
}