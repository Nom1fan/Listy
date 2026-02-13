package com.example.demo.productbank;

import com.example.demo.sharing.ListMemberDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ShareAllCategoriesResult {

    private ListMemberDto member;
    /** Number of categories the user was added to (may be less than total if already member of some). */
    private int categoriesAdded;
    /** Total number of categories owned by the inviter. */
    private int totalCategories;
}
