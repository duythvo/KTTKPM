package factory.method;

import model.Notification;
import model.SmsNotification;

public class SmsFactory extends NotificationFactory {

    @Override
    public Notification createNotification() {
        return new SmsNotification();
    }
}
