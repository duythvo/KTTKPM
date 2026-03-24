package fit.registerservice.controller;

import fit.registerservice.service.RegisterService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/register")
@RequiredArgsConstructor
public class RegisterController {

    private final RegisterService service;

    @PostMapping
    public String register(@RequestParam String username,
                           @RequestParam String password) {
        service.register(username, password);
        return "Register OK";
    }
}