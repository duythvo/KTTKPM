package com.fit.ordermanagement.state;

import com.fit.ordermanagement.model.Order;

public class ProcessingOrderState implements OrderState {
    @Override
    public void handle(Order order) {
        System.out.println("Đóng gói và vận chuyển đơn hàng...");
        order.setState(new DeliveredOrderState());
    }
}
