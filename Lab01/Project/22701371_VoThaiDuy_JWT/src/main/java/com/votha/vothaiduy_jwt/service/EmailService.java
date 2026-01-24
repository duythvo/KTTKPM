package com.votha.vothaiduy_jwt.service;

import com.votha.vothaiduy_jwt.dto.MailMessage;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;


import java.time.Year;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    public void sendEmail(MailMessage mailMessage) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper =
                    new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(mailMessage.getTo());
            helper.setSubject(mailMessage.getSubject());
            helper.setText(mailMessage.getContent(), true); // true = HTML

            mailSender.send(message);

            System.out.println("✅ Email sent to " + mailMessage.getTo());
        } catch (MessagingException e) {
            throw new RuntimeException("❌ Send email failed", e);
        }
    }


    public void sendOTP(String email, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setSubject("Your OTP Code");

            // Thymeleaf context
            Context context = new Context();
            context.setVariable("otp", otp);
            context.setVariable("year", Year.now().getValue());

            String html = templateEngine.process("otp-email", context);
            helper.setText(html, true);

            mailSender.send(message);
            System.out.println("✅ OTP Email sent to " + email);
        } catch (MessagingException e) {
            throw new RuntimeException("❌ Error sending OTP email: " + e.getMessage(), e);
        }
    }
}
