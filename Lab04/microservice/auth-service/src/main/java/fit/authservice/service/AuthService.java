package fit.authservice.service;

import fit.authservice.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserClient userClient;
    private final PasswordEncoder encoder;

    public boolean login(String username, String password) {
        User user = userClient.getUser(username);

        if (user == null) return false;

        return encoder.matches(password, user.getPassword());
    }
}
