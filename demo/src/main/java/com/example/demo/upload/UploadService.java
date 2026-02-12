package com.example.demo.upload;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UploadService {

    @Value("${listy.upload.dir:./uploads}")
    private String uploadDirRaw;

    /** Resolved absolute upload base; avoids relative path under Tomcat work dir. */
    private Path uploadBase;

    @PostConstruct
    void resolveUploadBase() {
        uploadBase = Path.of(uploadDirRaw).toAbsolutePath().normalize();
        log.info("Upload directory: {}", uploadBase);
    }

    @Value("${listy.app.base-url:}")
    private String baseUrl;

    public String saveCategoryImage(MultipartFile file) throws IOException {
        return saveFile(file, "category");
    }

    public String saveProductImage(MultipartFile file) throws IOException {
        return saveFile(file, "product");
    }

    public String saveListItemImage(MultipartFile file) throws IOException {
        return saveFile(file, "item");
    }

    public String saveListImage(MultipartFile file) throws IOException {
        return saveFile(file, "list");
    }

    private String saveFile(MultipartFile file, String subdir) throws IOException {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("No file");
        String ext = getExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + ext;
        Path dir = uploadBase.resolve(subdir);
        Files.createDirectories(dir);
        Path target = dir.resolve(filename);
        file.transferTo(target);
        String path = "/uploads/" + subdir + "/" + filename;
        if (baseUrl != null && !baseUrl.isBlank()) {
            return baseUrl.replaceAll("/$", "") + path;
        }
        return path;
    }

    private static String getExtension(String name) {
        if (name == null || !name.contains(".")) return "";
        return name.substring(name.lastIndexOf('.'));
    }
}
