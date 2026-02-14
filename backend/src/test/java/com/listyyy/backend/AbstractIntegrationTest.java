package com.listyyy.backend;

import com.listyyy.backend.auth.EmailOtpRepository;
import com.listyyy.backend.auth.PhoneOtpRepository;
import com.listyyy.backend.auth.RefreshTokenRepository;
import com.listyyy.backend.auth.User;
import com.listyyy.backend.auth.UserRepository;
import com.listyyy.backend.list.GroceryListRepository;
import com.listyyy.backend.list.ListItemRepository;
import com.listyyy.backend.list.ListMemberRepository;
import com.listyyy.backend.productbank.Category;
import com.listyyy.backend.productbank.CategoryMember;
import com.listyyy.backend.productbank.CategoryMemberRepository;
import com.listyyy.backend.productbank.CategoryRepository;
import com.listyyy.backend.productbank.Product;
import com.listyyy.backend.productbank.ProductRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class AbstractIntegrationTest {

    @Autowired
    protected MockMvc mvc;
    @Autowired
    protected ObjectMapper objectMapper;
    @Autowired
    protected UserRepository userRepository;
    @Autowired
    protected PasswordEncoder passwordEncoder;
    @Autowired
    protected CategoryRepository categoryRepository;
    @Autowired
    protected ProductRepository productRepository;
    @Autowired
    protected PhoneOtpRepository phoneOtpRepository;
    @Autowired
    protected EmailOtpRepository emailOtpRepository;
    @Autowired
    protected ListItemRepository listItemRepository;
    @Autowired
    protected ListMemberRepository listMemberRepository;
    @Autowired
    protected GroceryListRepository listRepository;
    @Autowired
    protected CategoryMemberRepository categoryMemberRepository;
    @Autowired
    protected RefreshTokenRepository refreshTokenRepository;

    protected String authToken;
    protected User testUser;
    protected UUID categoryId;
    protected UUID productId;

    @BeforeEach
    void baseSetUp() throws Exception {
        listItemRepository.deleteAll();
        listMemberRepository.deleteAll();
        listRepository.deleteAll();
        phoneOtpRepository.deleteAll();
        emailOtpRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        categoryMemberRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();

        testUser = User.builder()
                .email("test@example.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .displayName("Test User")
                .locale("he")
                .build();
        testUser = userRepository.save(testUser);

        authToken = login("test@example.com", "password123");

        Category cat = Category.builder()
                .owner(testUser)
                .nameHe("מכולת")
                .iconId("groceries")
                .sortOrder(0)
                .build();
        cat = categoryRepository.save(cat);
        categoryMemberRepository.save(CategoryMember.builder()
                .categoryId(cat.getId())
                .userId(testUser.getId())
                .category(cat)
                .user(testUser)
                .role("owner")
                .build());
        categoryId = cat.getId();

        Product product = Product.builder()
                .category(cat)
                .nameHe("אורז")
                .defaultUnit("קילו")
                .build();
        product = productRepository.save(product);
        productId = product.getId();
    }

    protected String login(String email, String password) throws Exception {
        ResultActions result = mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                        java.util.Map.of("email", email, "password", password))))
                .andExpect(status().isOk());
        String body = result.andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("token").asText();
    }

    protected String getBearerToken() {
        return "Bearer " + authToken;
    }
}
