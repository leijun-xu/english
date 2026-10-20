package com.english.server.user;

import com.english.server.config.AppProperties;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.SetBucketPolicyArgs;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.util.Map;

@Service
public class MinioStorageService {
    private final AppProperties.Minio properties;
    private final MinioClient client;

    public MinioStorageService(AppProperties appProperties) {
        this.properties = appProperties.minio();
        String scheme = properties.sslEnabled() ? "https" : "http";
        String endpoint = properties.endpoint().startsWith("http")
                ? properties.endpoint()
                : scheme + "://" + properties.endpoint() + ":" + properties.port();
        this.client = MinioClient.builder()
                .endpoint(endpoint)
                .credentials(properties.accessKey(), properties.secretKey())
                .build();
    }

    public Map<String, String> upload(MultipartFile file) throws Exception {
        ensureBucket();
        String fileName = System.currentTimeMillis() + "-" + file.getOriginalFilename();
        byte[] bytes = file.getBytes();
        client.putObject(PutObjectArgs.builder()
                .bucket(properties.bucket())
                .object(fileName)
                .stream(new ByteArrayInputStream(bytes), bytes.length, -1)
                .contentType(file.getContentType())
                .build());

        String databaseUrl = "/" + properties.bucket() + "/" + fileName;
        String scheme = properties.sslEnabled() ? "https" : "http";
        String host = properties.endpoint().replaceFirst("^https?://", "");
        String previewUrl = scheme + "://" + host + ":" + properties.port() + databaseUrl;
        return Map.of("previewUrl", previewUrl, "databaseUrl", databaseUrl);
    }

    private void ensureBucket() throws Exception {
        if (client.bucketExists(BucketExistsArgs.builder().bucket(properties.bucket()).build())) {
            return;
        }
        client.makeBucket(MakeBucketArgs.builder().bucket(properties.bucket()).build());
        String policy = """
                {"Version":"2012-10-17","Statement":[{"Sid":"PublicReadObjects","Effect":"Allow",
                "Principal":"*","Action":["s3:GetObject"],"Resource":["arn:aws:s3:::%s/*"]}]}
                """.formatted(properties.bucket());
        client.setBucketPolicy(SetBucketPolicyArgs.builder()
                .bucket(properties.bucket())
                .config(policy)
                .build());
    }
}
