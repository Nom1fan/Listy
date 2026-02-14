package com.listyyy.backend.list;

import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ListMemberId implements Serializable {

    private UUID listId;
    private UUID userId;
}
