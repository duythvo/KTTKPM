import com.fit.ordermanagement.decorator.BasicOrderService;
import com.fit.ordermanagement.decorator.GiftWrapDecorator;
import com.fit.ordermanagement.decorator.OrderService;
import com.fit.ordermanagement.model.Order;
import com.fit.ordermanagement.state.CanceledOrderState;
import com.fit.ordermanagement.strategy.BankRefund;

//TIP To <b>Run</b> code, press <shortcut actionId="Run"/> or
// click the <icon src="AllIcons.Actions.Execute"/> icon in the gutter.
public class Main {
    public static void main(String[] args) {

        // STATE + STRATEGY
        Order order = new Order();
        order.setRefundStrategy(new BankRefund());

        order.process(); // New -> Processing
        order.process(); // Processing -> Delivered

        // Hủy đơn
        order.setState(new CanceledOrderState());
        order.process();

        System.out.println("-----");

        // DECORATOR
        OrderService service = new GiftWrapDecorator(new BasicOrderService());
        service.execute();
    }
}