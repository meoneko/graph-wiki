namespace DotnetMvc.DTOs;

public record CreateOrderRequest(string ProductName, int Quantity, decimal UnitPrice);

public record CreateUserRequest(string Name, string Email);

public class OrderDto
{
    public Guid Id { get; set; }
    public string ProductName { get; set; } = string.Empty;
}
