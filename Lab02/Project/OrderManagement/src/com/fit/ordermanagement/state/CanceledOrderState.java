package com.fit.ordermanagement.state;

import com.fit.ordermanagement.model.Order;

public class CanceledOrderState implements OrderState {
    @Override
    public void handle(Order order) {
        System.out.println("Đơn hàng bị hủy!");
        order.refund();
    }
}
