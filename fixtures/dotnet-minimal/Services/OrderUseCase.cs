using DotnetMinimal.Models;

namespace DotnetMinimal.Services;

public class OrderUseCase
{
    public async Task<OrderDto?> GetAsync(Guid id)
    {
        await Task.Delay(0);
        return new OrderDto(id, "Sample Product", 1, 9.99m);
    }

    public async Task<OrderDto> CreateAsync(CreateOrderRequest request)
    {
        await Task.Delay(0);
        return new OrderDto(Guid.NewGuid(), request.ProductName, request.Quantity, request.UnitPrice);
    }

    public async Task DeleteAsync(Guid id)
    {
        await Task.Delay(0);
    }
}
