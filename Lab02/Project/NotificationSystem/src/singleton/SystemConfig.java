package singleton;

public class SystemConfig {
    //Single ton o day, khong cho goi SystemConfig o ben ngoai
    private static SystemConfig instance;

    private String environment;

    private SystemConfig() {
        environment = "DEV";
    }

    public static synchronized SystemConfig getInstance() {
        if (instance == null) {
            instance = new SystemConfig();
        }
        return instance;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }
}
