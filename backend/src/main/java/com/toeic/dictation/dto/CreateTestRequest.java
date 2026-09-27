package com.toeic.dictation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTestRequest {

    @NotBlank(message = "Năm phát hành / Bộ đề không được để trống (vd: 2023 hoặc ETS 2023)")
    private String year;

    @NotNull(message = "Số thứ tự đề không được để trống")
    @Min(value = 1, message = "Số thứ tự đề phải lớn hơn 0")
    private Integer testNumber;

    private String title;

    private String description;
}
