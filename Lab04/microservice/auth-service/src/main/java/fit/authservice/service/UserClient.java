package fit.authservice.service;

import fit.authservice.model.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class UserClient {

    private final WebClient webClient;

    public UserClient(@Value("${services.user-service-url}") String userServiceUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(userServiceUrl)
                .build();
    }

    public User getUser(String username) {
        return webClient.get()
                .uri("/users/" + username)
                .retrieve()
                .bodyToMono(User.class)
                .block();
    }
}