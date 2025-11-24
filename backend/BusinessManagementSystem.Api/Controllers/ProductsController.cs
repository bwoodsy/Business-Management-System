using Microsoft.AspNetCore.Mvc;
using BusinessManagementSystem.Api.Models;
using BusinessManagementSystem.Api.Services;
using BusinessManagementSystem.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace BusinessManagementSystem.Api.Controllers;

[ApiController] // tells ASP.NET that this is a web controller
[Route("api/[controller]")] // controller become Products so "api/products"
public class ProductsController : ControllerBase // ControllerBase gives us helpers
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Product>>> GetAll()
    {
        var products = await _productService.GetAllAsync();
        return Ok(products);
    }


    [HttpGet("{id:int}")]
    public async Task<ActionResult<Product>> GetById(int id)
    {
        var product = await _productService.GetByIdAsync(id);

        if (product == null)
            return NotFound();

        return Ok(product);
    }

    [HttpPost]
    public async Task<ActionResult<Product>> AddProduct(Product product)
    {
        var created = await _productService.AddAsync(product);

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateProduct(int id, Product updatedProduct)
    {
        var updated = await _productService.UpdateAsync(id, updatedProduct);

        if (!updated)
            return NotFound();

        return NoContent();
    }


    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var deleted = await _productService.DeleteAsync(id);

        if (!deleted)
            return NotFound();

        return NoContent();
    }
}