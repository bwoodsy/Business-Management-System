using BusinessManagementSystem.Api.Data;
using BusinessManagementSystem.Api.Dtos;
using BusinessManagementSystem.Api.Mappings;
using BusinessManagementSystem.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace BusinessManagementSystem.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProductsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/products
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetAll()
    {
        var products = await _context.Products
            .AsNoTracking()
            .Include(p => p.Category)              // needed for CategoryName
            .OrderBy(p => p.Name)
            .ToListAsync();

        return Ok(products.Select(p => p.ToDto()));
    }

    // GET: api/products/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductDto>> GetById(int id)
    {
        var product = await _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null) return NotFound();

        return Ok(product.ToDto());
    }

    // POST: api/products
    [HttpPost]
    public async Task<ActionResult<ProductDto>> Create(CreateProductDto dto)
    {
        // optional: validate category exists (nice polish)
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId);
        if (!categoryExists)
            return BadRequest(new { message = $"CategoryId {dto.CategoryId} does not exist." });

        var product = dto.ToEntity();

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        // Reload with category so CategoryName is populated
        await _context.Entry(product).Reference(p => p.Category).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product.ToDto());
    }

    // PUT: api/products/5
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateProductDto dto)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        // optional: validate category exists
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId);
        if (!categoryExists)
            return BadRequest(new { message = $"CategoryId {dto.CategoryId} does not exist." });

        dto.Apply(product);

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: api/products/5
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
