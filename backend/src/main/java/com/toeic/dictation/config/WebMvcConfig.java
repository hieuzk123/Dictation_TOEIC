package com.toeic.dictation.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.audio-dir:../data_pipeline/sample_data/}")
    private String audioDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path audioPath = Paths.get(audioDir).toAbsolutePath().normalize();
        String resourceLocation = audioPath.toUri().toString();
        if (!resourceLocation.endsWith("/")) {
            resourceLocation += "/";
        }

        registry.addResourceHandler("/audio/**")
                .addResourceLocations(resourceLocation);
    }
}
