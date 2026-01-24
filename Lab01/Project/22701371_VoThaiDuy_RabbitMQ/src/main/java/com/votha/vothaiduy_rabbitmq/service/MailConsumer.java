package com.votha.vothaiduy_rabbitmq.service;

import com.votha.vothaiduy_rabbitmq.config.RabbitConfig;
import com.votha.vothaiduy_rabbitmq.dto.MailMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailConsumer {
    private final JavaMailSender mailSender;

    @RabbitListener(queues = RabbitConfig.QUEUE)
    public void receiveMail(MailMessage message){
        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setTo(message.getTo());
        mail.setSubject(message.getSubject());
        mail.setText(message.getContent());

        mailSender.send(mail);

        System.out.println("Mail sent to: " + message.getTo());

    }
}
