package com.example.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;

@Service
public class StorageService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-key}")
    private String serviceKey;

    @Value("${supabase.bucket}")
    private String bucket;

    private final HttpClient client = HttpClient.newHttpClient();

    public String uploadPdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalStateException("Please choose a PDF file");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new IllegalStateException("Could not read the uploaded file");
        }

        // real PDFs start with "%PDF"
        boolean looksLikePdf = bytes.length > 4
                && bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F';
        if (!looksLikePdf) {
            throw new IllegalStateException("Only PDF files can be uploaded");
        }

        String base = supabaseUrl.endsWith("/") ? supabaseUrl.substring(0, supabaseUrl.length() - 1) : supabaseUrl;
        String fileName = UUID.randomUUID() + ".pdf";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(base + "/storage/v1/object/" + bucket + "/" + fileName))
                .header("Authorization", "Bearer " + serviceKey)
                .header("apikey", serviceKey)
                .header("Content-Type", "application/pdf")
                .POST(HttpRequest.BodyPublishers.ofByteArray(bytes))
                .build();

        try {
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200 && response.statusCode() != 201) {
                throw new IllegalStateException("Upload failed (" + response.statusCode() + "): " + response.body());
            }
        } catch (IOException e) {
            throw new IllegalStateException("Could not reach the file storage");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Upload was interrupted");
        }

        return base + "/storage/v1/object/public/" + bucket + "/" + fileName;
    }
}