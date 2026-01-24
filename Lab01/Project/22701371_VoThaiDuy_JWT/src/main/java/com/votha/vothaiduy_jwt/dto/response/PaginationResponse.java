package com.votha.vothaiduy_jwt.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PaginationResponse<T> {
    private List<T> items;
    private int currentPage;
    private int pageSizes;
    private int totalItems;
    private int totalPages;
}
