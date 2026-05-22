package com.example.demo;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.stereotype.Service;
import org.springframework.stereotype.Repository;

@RestController
public class OrdersController {
    @GetMapping("/orders")
    public List<Order> getOrders() {
        return orderService.findAll();
    }
}

@Service
public class OrderService {
    private final OrderRepository repository;

    public OrderService(OrderRepository repository) {
        this.repository = repository;
    }

    public List<Order> findAll() {
        return repository.findAll();
    }
}

@Repository
public class OrderRepository {
    public List<Order> findAll() {
        return List.of();
    }
}

public class OrderMapper {
    public OrderDto toDto(Order order) {
        return new OrderDto(order.getId(), order.getName());
    }
}
