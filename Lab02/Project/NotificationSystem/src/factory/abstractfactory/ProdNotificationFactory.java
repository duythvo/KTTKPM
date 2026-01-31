package factory.abstractfactory;

import model.EmailNotification;
import model.Notification;
import model.SmsNotification;

public class ProdNotificationFactory implements NotificationAbstractFactory {

    @Override
    public Notification createEmail() {
        return new EmailNotification();
    }

    @Override
    public Notification createSms() {
        return new SmsNotification();
    }
}
