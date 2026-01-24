package com.votha.vothaiduy_rabbitmq.controller;

import com.votha.vothaiduy_rabbitmq.dto.MailMessage;
import com.votha.vothaiduy_rabbitmq.service.MailProducer;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/mail")
public class MailController {
    private final MailProducer producer;

    @PostMapping("/send")
    public String sendMail(){
        MailMessage msg = new MailMessage(
                "duythai463@gmail.com",
                "Test RabbitMQ",
                "Hello! This is a test email sent using RabbitMQ."
        );
        producer.sendMail(msg);
        return "Send mail successfully!";
    }
}
