package fit.registerservice.service;

import fit.registerservice.model.User;
import fit.registerservice.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RegisterService {

    private final UserRepository repo;
    private final PasswordEncoder encoder;

    public void register(String username, String password) {
        repo.save(User.builder()
                .username(username)
                .password(encoder.encode(password))
                .role("USER")
                .build());
    }
}
