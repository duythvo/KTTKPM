package com.fit.ordermanagement.strategy;

public class EWalletRefund implements RefundStrategy {
    @Override
    public void refund() {
        System.out.println("Hoan tien qua vi dien tu.");
    }
}
