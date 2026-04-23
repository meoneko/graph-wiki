using Microsoft.AspNetCore.Mvc;
using DotnetMvc.DTOs;

namespace DotnetMvc.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    [HttpGet("{id}")]
    public IActionResult GetUser(Guid id)
    {
        return Ok(new { Id = id, Name = "Test User" });
    }

    [HttpPost]
    public IActionResult CreateUser([FromBody] CreateUserRequest request)
    {
        return Created($"/api/users/{Guid.NewGuid()}", request);
    }
}
