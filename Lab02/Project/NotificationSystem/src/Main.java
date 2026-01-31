import factory.abstractfactory.DevNotificationFactory;
import factory.abstractfactory.NotificationAbstractFactory;
import factory.abstractfactory.ProdNotificationFactory;
import factory.method.EmailFactory;
import factory.method.NotificationFactory;
import factory.method.SmsFactory;
import singleton.SystemConfig;

//TIP To <b>Run</b> code, press <shortcut actionId="Run"/> or
// click the <icon src="AllIcons.Actions.Execute"/> icon in the gutter.
public class Main {
    public static void main(String[] args) {

        // SINGLETON
        SystemConfig config = SystemConfig.getInstance();
        config.setEnvironment("PROD");
        System.out.println("ENV: " + config.getEnvironment());

        // FACTORY METHOD
        NotificationFactory emailFactory = new EmailFactory();
        emailFactory.sendNotification("Hello via Email");

        NotificationFactory smsFactory = new SmsFactory();
        smsFactory.sendNotification("Hello via SMS");

        System.out.println("-----");

        // ABSTRACT FACTORY
        NotificationAbstractFactory factory;

        if (config.getEnvironment().equals("PROD")) {
            factory = new ProdNotificationFactory();
        } else {
            factory = new DevNotificationFactory();
        }

        factory.createEmail().send("Abstract Factory Email");
        factory.createSms().send("Abstract Factory SMS");
    }
}