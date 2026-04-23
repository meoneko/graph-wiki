using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DotnetMvc.DTOs;
using DotnetMvc.UseCases;

namespace DotnetMvc.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly CreateOrderUseCase _createOrder;
    private readonly GetOrderUseCase _getOrder;

    public OrdersController(CreateOrderUseCase createOrder, GetOrderUseCase getOrder)
    {
        _createOrder = createOrder;
        _getOrder = getOrder;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetOrder(Guid id)
    {
        var result = await _getOrder.ExecuteAsync(id);
        if (result is null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var result = await _createOrder.ExecuteAsync(request);
        return Created($"/api/orders/{result.Id}", result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteOrder(Guid id)
    {
        await _createOrder.DeleteAsync(id);
        return NoContent();
    }
}
