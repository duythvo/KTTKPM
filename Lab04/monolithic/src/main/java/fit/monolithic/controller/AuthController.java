package fit.monolithic.controller;


import fit.monolithic.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public String register(@RequestParam String username,
                           @RequestParam String password) {
        userService.register(username, password);
        return "Register success!";
    }

    @PostMapping("/login")
    public String login(@RequestParam String username,
                        @RequestParam String password) {

        boolean success = userService.login(username, password);
        return success ? "Login success!" : "Login failed!";
    }
}