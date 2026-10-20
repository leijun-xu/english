# English Server Java

Spring Boot 3 implementation of `../server/apps/server`. It keeps the same HTTP
routes, response envelope, JWT claims, PostgreSQL tables, MinIO paths, Alipay
flow, tracker analytics, and Socket.IO event names.

The separate NestJS `apps/ai` service is not part of this project.

## Requirements

- Java 21
- PostgreSQL database initialized by `../server/prisma/migrations`
- MinIO and Alipay configuration used by the NestJS server

## Configuration

The application automatically loads `../server/.env`. A Prisma-style
`postgresql://` `DATABASE_URL` is converted to JDBC at startup. Environment
variables still take precedence. See `.env.example` for all supported values.

HTTP listens on `3000`. Java Socket.IO listens on `3002` because it runs as a
dedicated Netty server. Point the frontend `VITE_SOCKET_URL` to
`http://localhost:3002`.

## Run

```bash
./mvnw spring-boot:run
```

Swagger UI:

```text
http://localhost:3000/api/swagger
```

## Build And Test

```bash
./mvnw clean test
./mvnw clean package
```

## API Compatibility

All routes use the `/api/v1` prefix:

- `GET /`
- `POST /user/login`
- `POST /user/register`
- `POST /user/refresh-token`
- `POST /user/upload-avatar`
- `POST /user/update-user`
- `GET /word-book`
- `GET /course/list`
- `GET /course/my`
- `GET /learn/word/{id}`
- `POST /learn/word/master`
- `POST /pay/create`
- `ALL /pay/notify`
- `POST /tracker/uv`
- `POST /tracker/update-uv`
- `POST|GET /tracker/performance`
- `POST /tracker/pv`
- `POST|GET /tracker/event(s)`
- `POST /tracker/error`
- `GET /tracker/analytics`
- `GET /tracker/visitors`
- `GET /tracker/page-views`
- `GET /tracker/errors`

Successful and business-error responses keep HTTP 200 and use the NestJS
envelope. Authentication failures use HTTP 401.

## Behavioral Notes

- Password comparison intentionally remains plaintext to preserve current
  NestJS behavior and existing data compatibility.
- Access tokens expire after 10 seconds and refresh tokens after 7 days.
- Payment notification handling intentionally matches the current NestJS flow;
  add Alipay signature verification before production use.
