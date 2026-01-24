package com.votha.vothaiduy_jwt.service;

import com.votha.vothaiduy_jwt.dto.MailMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MailConsumer {

    private final EmailService emailService;

    @RabbitListener(queues = "mail.queue")
    public void receiveMail(MailMessage mailMessage) {
        System.out.println("Received mail message: " + mailMessage.getTo());
        emailService.sendEmail(mailMessage);
    }
}

