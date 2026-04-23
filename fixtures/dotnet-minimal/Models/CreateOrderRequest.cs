namespace DotnetMinimal.Models;

public record CreateOrderRequest(string ProductName, int Quantity, decimal UnitPrice);

public record OrderDto(Guid Id, string ProductName, int Quantity, decimal UnitPrice);
