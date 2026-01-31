package com.fit.ordermanagement.decorator;

public class GiftWrapDecorator extends OrderDecorator {

    public GiftWrapDecorator(OrderService orderService) {
        super(orderService);
    }

    @Override
    public void execute() {
        super.execute();
        System.out.println("Thêm dịch vụ gói quà");
    }
}

