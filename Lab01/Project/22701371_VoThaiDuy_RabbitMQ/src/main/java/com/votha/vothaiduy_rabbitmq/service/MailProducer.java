package com.votha.vothaiduy_rabbitmq.service;

import com.votha.vothaiduy_rabbitmq.config.RabbitConfig;
import com.votha.vothaiduy_rabbitmq.dto.MailMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailProducer {
    private final RabbitTemplate rabbitTemplate;

    public void sendMail(MailMessage message){
        /*
         * Exchange: Dung de chuyen doi tin nhan
         * * Routing Key: Dung de dinh tuy duong di cua tin nhan
         * * Queue: Noi luu tru tin nhan
         */

        rabbitTemplate.convertAndSend(RabbitConfig.EXCHANGE, RabbitConfig.ROUTING_KEY, message);
    }
}
