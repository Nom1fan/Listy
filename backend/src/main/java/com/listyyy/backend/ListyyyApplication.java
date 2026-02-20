package com.listyyy.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ListyyyApplication {

    public static void main(String[] args) {
        SpringApplication.run(ListyyyApplication.class, args);
    }

}
