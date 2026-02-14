package com.listyyy.backend.upload;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UploadService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"
    );

    @Value("${listyyy.upload.dir:./uploads}")
    private String uploadDirRaw;

    /** Resolved absolute upload base; avoids relative path under Tomcat work dir. */
    private Path uploadBase;

    @PostConstruct
    void resolveUploadBase() {
        uploadBase = Path.of(uploadDirRaw).toAbsolutePath().normalize();
        log.info("Upload directory: {}", uploadBase);
    }

    @Value("${listyyy.app.base-url:}")
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

    public String saveProfileImage(MultipartFile file) throws IOException {
        return saveFile(file, "profile");
    }

    private String saveFile(MultipartFile file, String subdir) throws IOException {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("לא נבחר קובץ");
        String ext = getSafeExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + ext;
        Path dir = uploadBase.resolve(subdir);
        Files.createDirectories(dir);
        Path target = dir.resolve(filename).normalize();
        // Prevent path traversal: ensure target stays inside uploadBase
        if (!target.startsWith(uploadBase)) {
            throw new IllegalArgumentException("שם קובץ לא תקין");
        }
        file.transferTo(target);
        String path = "/uploads/" + subdir + "/" + filename;
        if (baseUrl != null && !baseUrl.isBlank()) {
            return baseUrl.replaceAll("/$", "") + path;
        }
        return path;
    }

    /** Extract and validate extension — only allow known image types. */
    private static String getSafeExtension(String name) {
        if (name == null || !name.contains(".")) return ".png";
        String ext = name.substring(name.lastIndexOf('.')).toLowerCase();
        // Strip anything after the extension (e.g. double-extension attacks)
        if (ext.contains("/") || ext.contains("\\") || ext.contains("..")) {
            throw new IllegalArgumentException("שם קובץ לא תקין");
        }
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("סוג קובץ לא נתמך. יש להעלות תמונה (jpg, png, gif, webp)");
        }
        return ext;
    }
}
