using Microsoft.AspNetCore.Mvc;

namespace Demo.Api;

[ApiController]
[Route("api/students")]
public class StudentsController : ControllerBase
{
    [HttpGet("{id}")]
    public StudentDto GetStudent(int id)
    {
        return LoadStudent(id);
    }

    private StudentDto LoadStudent(int id)
    {
        return new StudentDto(id, "Ada");
    }
}

public class CreateStudentUseCase
{
    public StudentDto Execute(CreateStudentCommand command)
    {
        return new StudentDto(1, command.Name);
    }
}

public record StudentDto(int Id, string Name);
public record CreateStudentCommand(string Name);

var app = WebApplication.Create();
app.MapGet("/health", () => Results.Ok());
