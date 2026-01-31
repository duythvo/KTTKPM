package com.fit.ordermanagement.state;

import com.fit.ordermanagement.model.Order;

public interface OrderState {
    void handle(Order order);
}
