package com.fit.ordermanagement.state;

import com.fit.ordermanagement.model.Order;

public class DeliveredOrderState implements OrderState {
    @Override
    public void handle(Order order) {
        System.out.println("Đơn hàng đã được giao thành công!");
    }
}
