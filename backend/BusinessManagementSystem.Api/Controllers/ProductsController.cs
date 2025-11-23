using Microsoft.AspNetCore.Mvc;
using BusinessManagementSystem.Api.Models;

namespace BusinessManagementSystem.Api.Controllers;

[ApiController] // tells ASP.NET that this is a web controller
[Route("api/[controller]")] // controller become Products so "api/products"
public class ProductsController : ControllerBase // ControllerBase gives us helpers
{
    private static readonly List<Product> _products = new()
    {
        new Product
        {
            Id = 1,
            Name = "iPhone 13 Screen",
            Price = 120.00m,
            Stock = 5,
            CategoryId = 1,
            Category = new Category { Id = 1, Name = "Screens" }
        },
        new Product
        {
            Id = 2,
            Name = "Galaxy S21 Battery",
            Price = 40.00m,
            Stock = 10,
            CategoryId = 2,
            Category = new Category { Id = 2, Name = "Batteries" }
        }
    };

    // GET: api/products
    [HttpGet] // handles the get HTTP request
    public ActionResult<IEnumerable<Product>> GetAll() // returns a list of products with an HTTP status code
    {
        // 200 OK + JSON body
        return Ok(_products); 
    }

    // GET: a single product by id
    [HttpGet("{id:int}")]
    public ActionResult<Product> GetById(int id)
    {
        var product = _products.Find(p => p.Id == id);
        
        // returns 404 if not found
        if (product == null)
            return NotFound();
        
        // reutns the product (200 OK + JSON)
        return Ok(product);
    }

    // product creation
    [HttpPost]
    public ActionResult<Product> AddProduct(Product product)
    {
        var nextId = _products.Max(p => p.Id) + 1;
        product.Id = nextId;

        _products.Add(product);
        
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);

    }
}