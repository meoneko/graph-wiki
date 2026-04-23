using DotnetMinimal.Models;
using DotnetMinimal.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddScoped<OrderUseCase>();
var app = builder.Build();

app.MapGet("/api/orders/{id}", async (Guid id, OrderUseCase useCase) =>
{
    var order = await useCase.GetAsync(id);
    return order is null ? Results.NotFound() : Results.Ok(order);
});

app.MapPost("/api/orders", async (CreateOrderRequest request, OrderUseCase useCase) =>
{
    var result = await useCase.CreateAsync(request);
    return Results.Created($"/api/orders/{result.Id}", result);
});

app.MapDelete("/api/orders/{id}", async (Guid id, OrderUseCase useCase) =>
{
    await useCase.DeleteAsync(id);
    return Results.NoContent();
});

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

app.Run();
