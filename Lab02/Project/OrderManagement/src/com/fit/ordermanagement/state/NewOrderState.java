package com.fit.ordermanagement.state;

import com.fit.ordermanagement.model.Order;

public class NewOrderState implements OrderState {
    @Override
    public void handle(Order order) {
        System.out.println("Kiểm tra thông tin đơn hàng...");
        order.setState(new ProcessingOrderState());
    }
}
