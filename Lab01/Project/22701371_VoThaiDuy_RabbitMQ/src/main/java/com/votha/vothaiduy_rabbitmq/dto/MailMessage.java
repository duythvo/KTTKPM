package com.votha.vothaiduy_rabbitmq.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MailMessage {
    private String to;
    private String subject;
    private String content;
}
