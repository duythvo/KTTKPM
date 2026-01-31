package factory.abstractfactory;

import model.Notification;

public interface NotificationAbstractFactory {
    Notification createEmail();
    Notification createSms();
}
