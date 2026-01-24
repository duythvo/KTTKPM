package com.votha.vothaiduy_jwt.service;

import com.votha.vothaiduy_jwt.dto.MailMessage;
import com.votha.vothaiduy_jwt.dto.request.BookingRequest;
import com.votha.vothaiduy_jwt.entity.*;
import com.votha.vothaiduy_jwt.enumm.SeatState;
import com.votha.vothaiduy_jwt.repository.BookingRepository;
import com.votha.vothaiduy_jwt.repository.SeatStatusRepository;
import com.votha.vothaiduy_jwt.repository.TripRepository;
import com.votha.vothaiduy_jwt.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final SeatStatusRepository seatStatusRepo;
    private final BookingRepository bookingRepo;
    private final UserRepository userRepo;
    private final TripRepository tripRepo;
    private final EmailService emailService;
    private final MailProducer mailProducer;

    @Transactional
    public Booking bookSeats(BookingRequest request) {

        // 1. Lock seats
        List<SeatStatus> seats = seatStatusRepo.lockSeats(
                request.getTripId(),
                request.getSeatNumbers()
        );

        if (seats.size() != request.getSeatNumbers().size()) {
            throw new RuntimeException("Some seats do not exist");
        }

        // 2. Check availability
        boolean anyBooked = seats.stream()
                .anyMatch(s -> s.getStatus() != SeatState.AVAILABLE);

        if (anyBooked) {
            throw new RuntimeException("Some seats already booked");
        }

        // 3. Mark seats as BOOKED
        seats.forEach(s -> s.setStatus(SeatState.BOOKED));

        // 4. Create booking
        User user = userRepo.findById(request.getUserId()).orElseThrow();
        Trip trip = tripRepo.findById(request.getTripId()).orElseThrow();

        Booking booking = Booking.builder()
                .user(user)
                .trip(trip)
                .build();

        // 5. Create BookingSeat
        List<BookingSeat> bookingSeats = request.getSeatNumbers()
                .stream()
                .map(seat -> {
                    BookingSeat bs = new BookingSeat();
                    bs.setSeatNumber(seat);
                    bs.setBooking(booking);
                    return bs;
                })
                .toList();

        booking.setSeats(bookingSeats);
        //Thay vì gửi email trực tiếp, ta sẽ gửi qua RabbitMQ
        mailProducer.sendMail(MailMessage.builder()
                .to("duythvo2004@gmail.com")
                .subject("Booking Confirmation")
                .content("Your booking is confirmed for seats: " + String.join(", ", request.getSeatNumbers()))
                .build());

//        emailService.sendEmail(MailMessage.builder()
//                .to("duythvo2004@gmail.com")
//                .subject("Booking Confirmation")
//                .content("Your booking is confirmed for seats: " + String.join(", ", request.getSeatNumbers()))
//                .build()
//        );


        return bookingRepo.save(booking);
    }
}
