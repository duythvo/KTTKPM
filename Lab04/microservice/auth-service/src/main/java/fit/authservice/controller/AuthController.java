package fit.authservice.controller;

import fit.authservice.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService service;

    @PostMapping("/login")
    public String login(@RequestParam String username,
                        @RequestParam String password) {

        boolean success = service.login(username, password);

        if (success) {
            return "Login success!";
        }
        return "Login failed!";
    }
}
