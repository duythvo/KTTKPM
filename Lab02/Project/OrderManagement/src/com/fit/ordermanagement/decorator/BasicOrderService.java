package com.fit.ordermanagement.decorator;

public class BasicOrderService implements OrderService {
    @Override
    public void execute() {
        System.out.println("Xử lý đơn hàng cơ bản");
    }
}
