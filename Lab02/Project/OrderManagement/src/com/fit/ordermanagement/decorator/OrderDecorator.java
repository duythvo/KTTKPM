package com.fit.ordermanagement.decorator;

public abstract class OrderDecorator implements OrderService {
    protected OrderService orderService;

    public OrderDecorator(OrderService orderService) {
        this.orderService = orderService;
    }

    @Override
    public void execute() {
        orderService.execute();
    }
}
