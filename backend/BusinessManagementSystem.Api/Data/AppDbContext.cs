using Microsoft.EntityFrameworkCore;
using BusinessManagementSystem.Api.Models;

namespace BusinessManagementSystem.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Product> Products { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<RepairJob> RepairJobs => Set<RepairJob>();
    public DbSet<RepairJobItem> RepairJobItems => Set<RepairJobItem>();
   
}
