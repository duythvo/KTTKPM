package com.votha.vothaiduy_jwt.service;


import com.votha.vothaiduy_jwt.configuration.RabbitMQConfig;
import com.votha.vothaiduy_jwt.dto.MailMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MailProducer {

    private final RabbitTemplate rabbitTemplate;

    public void sendMail(MailMessage mailMessage) {
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.MAIL_QUEUE,
                mailMessage
        );

        System.out.println("Mail message sent to queue: " + mailMessage.getTo());
    }
}

