using BusinessManagementSystem.Api.Models;
using BusinessManagementSystem.Api.Dtos;

namespace BusinessManagementSystem.Api.Mappings;

public static class CustomerMappings
{
    public static CustomerDto ToDto(this Customer customer)
    {
        return new CustomerDto
        {
            Id = customer.Id,
            FirstName = customer.FirstName,
            LastName = customer.LastName,
            Email = customer.Email,
            PhoneNumber = customer.PhoneNumber,
            RepairJobIds = customer.RepairJobs.Select(rj => rj.Id).ToList()
        };
    }

    public static Customer ToEntity(this CreateCustomerDto createCustomerDto)
    {
        return new Customer
        {
            FirstName = createCustomerDto.FirstName,
            LastName = createCustomerDto.LastName,
            Email = createCustomerDto.Email,
            PhoneNumber = createCustomerDto.PhoneNumber,
            RepairJobs = createCustomerDto.RepairJobs
        };
    }

    public static void Apply(this UpdateCustomerDto updateCustomerDto, Customer customer)
    {
        customer.FirstName = updateCustomerDto.Name;
        customer.PhoneNumber = updateCustomerDto.Phone;
        customer.Email = updateCustomerDto.Email;
        customer.RepairJobs = updateCustomerDto.RepairJobs;
    }
}