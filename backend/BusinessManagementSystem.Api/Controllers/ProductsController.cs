using Microsoft.AspNetCore.Mvc;
using BusinessManagementSystem.Api.Models;
using BusinessManagementSystem.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace BusinessManagementSystem.Api.Controllers;

[ApiController] // tells ASP.NET that this is a web controller
[Route("api/[controller]")] // controller become Products so "api/products"
public class ProductsController : ControllerBase // ControllerBase gives us helpers
{
    private readonly AppDbContext _context;

    public ProductsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Product>>> GetAll()
    {
        var products = await _context.Products
            .Include(p => p.Category)
            .ToListAsync();

        return Ok(products);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Product>> GetById(int id)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
            return NotFound();

        return Ok(product);
    }

    [HttpPost]
    public async Task<ActionResult<Product>> AddProduct(Product product)
    {
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
    }
}