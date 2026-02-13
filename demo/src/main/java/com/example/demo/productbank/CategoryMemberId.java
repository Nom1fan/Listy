package com.example.demo.productbank;

import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class CategoryMemberId implements Serializable {

    private UUID categoryId;
    private UUID userId;
}
