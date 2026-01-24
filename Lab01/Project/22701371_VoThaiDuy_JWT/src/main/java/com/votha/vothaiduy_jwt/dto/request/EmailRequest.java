package com.votha.vothaiduy_jwt.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailRequest {
    private String recipient;
    private String subject;

    private String bookingId;
    private LocalDateTime bookingDate;
    private String tourTitle;
    private String tourDestination;
    private String tourDuration;
    private Integer numAdults;
    private Integer numChildren;
    private Double priceAdult;
    private Double priceChild;
    private Double totalPrice;
    private Double discountAmount;
    private Double finalAmount;
    private String note;

    private String invoiceId;
    private LocalDate invoiceDate;
    private String transactionId;
}
