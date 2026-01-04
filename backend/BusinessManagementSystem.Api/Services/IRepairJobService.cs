using BusinessManagementSystem.Api.Dtos;

namespace BusinessManagementSystem.Api.Services;

public interface IRepairJobService
{
    Task<RepairJobDto> CreateAsync(CreateRepairJobDto dto, string userId);
}
