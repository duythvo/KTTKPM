package factory.method;

import model.EmailNotification;
import model.Notification;

public class EmailFactory extends NotificationFactory {

    @Override
    public Notification createNotification() {
        return new EmailNotification();
    }
}
