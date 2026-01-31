package model;

public class SmsNotification implements Notification {

    @Override
    public void send(String message) {
        System.out.println("Gửi SMS: " + message);
    }
}
