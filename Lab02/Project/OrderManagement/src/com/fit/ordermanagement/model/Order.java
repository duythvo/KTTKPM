package com.fit.ordermanagement.model;

import com.fit.ordermanagement.state.NewOrderState;
import com.fit.ordermanagement.state.OrderState;
import com.fit.ordermanagement.strategy.RefundStrategy;

public class Order {
    private OrderState state;
    private RefundStrategy refundStrategy;

    public Order() {
        this.state = new NewOrderState();
    }

    public void setState(OrderState state) {
        this.state = state;
    }

    public void process() {
        state.handle(this);
    }

    public void setRefundStrategy(RefundStrategy refundStrategy) {
        this.refundStrategy = refundStrategy;
    }

    public void refund() {
        if (refundStrategy != null) {
            refundStrategy.refund();
        } else {
            System.out.println("Không có chiến lược hoàn tiền!");
        }
    }

}
