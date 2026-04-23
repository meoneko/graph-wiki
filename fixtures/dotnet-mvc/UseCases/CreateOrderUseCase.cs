using DotnetMvc.DTOs;

namespace DotnetMvc.UseCases;

public class CreateOrderUseCase
{
    public async Task<OrderDto> ExecuteAsync(CreateOrderRequest request)
    {
        await Task.Delay(0);
        return new OrderDto { Id = Guid.NewGuid(), ProductName = request.ProductName };
    }

    public async Task DeleteAsync(Guid id)
    {
        await Task.Delay(0);
    }
}

public class GetOrderUseCase
{
    public async Task<OrderDto?> ExecuteAsync(Guid id)
    {
        await Task.Delay(0);
        return new OrderDto { Id = id, ProductName = "Sample" };
    }
}
