package com.fit.ordermanagement.strategy;

public class BankRefund implements RefundStrategy {
    @Override
    public void refund() {
        System.out.println("Hoan tien qua ngan hang");
    }
}
