# Phase 2: Backend (Spring Boot 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hệ thống Backend hoàn chỉnh bằng Spring Boot 3 cung cấp RESTful API cho dự án Luyện nghe chép chính tả TOEIC Part 3 & 4, bao gồm xác thực JWT, phục vụ dữ liệu đề thi/audio/segments, thuật toán chấm điểm chép chính tả (Cloze & Full Dictation) và lưu vết lịch sử học tập.

**Architecture:** Kiến trúc phân tầng Layered Architecture chuẩn trong Spring Boot: Controller (REST API endpoints) $\rightarrow$ Service (Business Logic & Scoring Algorithm) $\rightarrow$ Repository (Spring Data JPA) $\rightarrow$ Database (MySQL `toeic_dictation`). Tích hợp Spring Security 6 với JWT Filter không trạng thái (stateless), WebMvc Static Resource Handler cho file audio MP3.

**Tech Stack:** Java 17/21, Spring Boot 3.3+, Spring Web, Spring Data JPA, Spring Security, Validation, MySQL Connector/J, jjwt 0.12.6, Lombok, JUnit 5, Mockito.

**Spec:** `PROJECT_STATE.md` (Phần 5, Giai đoạn 2) và `toeic_dictation_prompt.md`.

## Global Constraints

- Backend source code nằm hoàn toàn trong thư mục `backend/`.
- Database schema tuân thủ chính xác các bảng đã tạo tại `database/schema.sql`: `users`, `toeic_tests`, `audio_items`, `audio_segments`, `study_histories`.
- Mật khẩu người dùng luôn được băm bằng BCryptPasswordEncoder.
- Token JWT dùng thuật toán HS256 với secret key tối thiểu 256 bits, thời hạn hợp lệ mặc định 7 ngày.
- Thuật toán so khớp từ vựng không phân biệt hoa-thường và loại bỏ triệt để các dấu câu (`. , ? ! : ; " ' -`).
- Tất cả các endpoint trả về định dạng JSON chuẩn với HTTP status codes thích hợp (200, 201, 400, 401, 403, 404).

---

### Task 1: Khởi tạo Project Spring Boot 3 và Cấu hình Kết nối MySQL

**Files:**
- Create: `backend/pom.xml`
- Create: `backend/mvnw`, `backend/mvnw.cmd`, `backend/.mvn/wrapper/maven-wrapper.properties`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/java/com/toeic/dictation/ToeicDictationApplication.java`
- Create: `backend/src/test/java/com/toeic/dictation/ToeicDictationApplicationTests.java`

**Interfaces:**
- Consumes: Database `toeic_dictation` đang chạy trên MySQL `localhost:3306` (User: `root`, Password: rỗng).
- Produces: Ứng dụng Spring Boot có thể build, chạy test ngữ cảnh (Spring Context Test) thành công và kết nối tới MySQL.

- [ ] **Step 1: Tạo cấu trúc thư mục backend và tải Maven Wrapper / Starter từ start.spring.io**

Tạo thư mục `backend` và tải khung dự án Spring Boot 3.3+ với đầy đủ dependencies:
```powershell
New-Item -ItemType Directory -Force -Path "d:\Dictation_TOEIC\backend"
Invoke-RestMethod -Uri "https://start.spring.io/starter.zip?type=maven-project&language=java&bootVersion=3.3.4&baseDir=backend&groupId=com.toeic&artifactId=dictation&name=dictation&packageName=com.toeic.dictation&packaging=jar&javaVersion=17&dependencies=web,data-jpa,security,validation,mysql,lombok" -OutFile "d:\Dictation_TOEIC\starter.zip"
Expand-Archive -Path "d:\Dictation_TOEIC\starter.zip" -DestinationPath "d:\Dictation_TOEIC\temp_init" -Force
Copy-Item -Path "d:\Dictation_TOEIC\temp_init\backend\*" -Destination "d:\Dictation_TOEIC\backend\" -Recurse -Force
Remove-Item -Path "d:\Dictation_TOEIC\temp_init" -Recurse -Force
Remove-Item -Path "d:\Dictation_TOEIC\starter.zip" -Force
```

- [ ] **Step 2: Thêm thư viện JJWT vào pom.xml**

Cập nhật `backend/pom.xml` bổ sung các dependency JWT (version `0.12.6`):
```xml
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.12.6</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.12.6</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.12.6</version>
            <scope>runtime</scope>
        </dependency>
```

- [ ] **Step 3: Cấu hình application.yml kết nối MySQL và Audio Path**

Tạo file `backend/src/main/resources/application.yml`:
```yaml
server:
  port: 8080

spring:
  application:
    name: toeic-dictation-api
  datasource:
    url: jdbc:mysql://localhost:3306/toeic_dictation?useSSL=false&serverTimezone=UTC&characterEncoding=UTF-8&allowPublicKeyRetrieval=true
    username: root
    password: 
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.MySQLDialect

jwt:
  secret: 404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
  expiration-ms: 604800000 # 7 days in milliseconds

app:
  audio-dir: ../data_pipeline/sample_data/
```

- [ ] **Step 4: Kiểm tra build và chạy context test**

Chạy lệnh kiểm tra kết nối database và load context:
```powershell
cd d:\Dictation_TOEIC\backend
.\mvnw.cmd test -Dtest=ToeicDictationApplicationTests
```
Kỳ vọng: BUILD SUCCESS, contextLoads() pass.

- [ ] **Step 5: Git commit task 1**

```bash
git add backend/
git commit -m "feat(backend): initialize spring boot 3 project with mysql and jjwt configuration"
```

---

### Task 2: Xây dựng Domain Entities & Spring Data Repositories

**Files:**
- Create: `backend/src/main/java/com/toeic/dictation/model/User.java`
- Create: `backend/src/main/java/com/toeic/dictation/model/ToeicTest.java`
- Create: `backend/src/main/java/com/toeic/dictation/model/AudioItem.java`
- Create: `backend/src/main/java/com/toeic/dictation/model/AudioSegment.java`
- Create: `backend/src/main/java/com/toeic/dictation/model/StudyHistory.java`
- Create: `backend/src/main/java/com/toeic/dictation/repository/UserRepository.java`
- Create: `backend/src/main/java/com/toeic/dictation/repository/ToeicTestRepository.java`
- Create: `backend/src/main/java/com/toeic/dictation/repository/AudioItemRepository.java`
- Create: `backend/src/main/java/com/toeic/dictation/repository/AudioSegmentRepository.java`
- Create: `backend/src/main/java/com/toeic/dictation/repository/StudyHistoryRepository.java`
- Create: `backend/src/test/java/com/toeic/dictation/repository/RepositoryIntegrationTests.java`

**Interfaces:**
- Consumes: Cấu trúc 5 bảng trong database `toeic_dictation`.
- Produces: Các JPA Entities khớp với schema và Repositories có các method truy vấn theo `username`, `email`, `test_id`, `item_id`, `user_id`.

- [ ] **Step 1: Viết test kiểm tra truy vấn dữ liệu mẫu từ các Repository**

Tạo `backend/src/test/java/com/toeic/dictation/repository/RepositoryIntegrationTests.java`:
```java
package com.toeic.dictation.repository;

import com.toeic.dictation.model.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class RepositoryIntegrationTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ToeicTestRepository toeicTestRepository;

    @Autowired
    private AudioItemRepository audioItemRepository;

    @Autowired
    private AudioSegmentRepository audioSegmentRepository;

    @Test
    @DisplayName("Should query existing seed data from MySQL")
    void testQuerySeedData() {
        Optional<User> demoUser = userRepository.findByUsername("demo_user");
        assertTrue(demoUser.isPresent(), "demo_user should exist");
        assertEquals("demo@example.com", demoUser.get().getEmail());

        List<ToeicTest> tests = toeicTestRepository.findAllByOrderByYearDescTestNumberAsc();
        assertFalse(tests.isEmpty(), "Should have at least 1 test");

        List<AudioItem> items = audioItemRepository.findByTestIdOrderByPartAscItemNumberAsc(tests.get(0).getId());
        assertEquals(2, items.size(), "Should have 2 items (Part 3 & Part 4)");

        List<AudioSegment> segments = audioSegmentRepository.findByItemIdOrderBySegmentIndexAsc(items.get(0).getId());
        assertEquals(7, segments.size(), "Part 3 item should have 7 segments");
    }
}
```

- [ ] **Step 2: Tạo các Entity Models**

Tạo `User.java`:
```java
package com.toeic.dictation.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String role = "ROLE_USER";

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
```

Tạo `ToeicTest.java`:
```java
package com.toeic.dictation.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "toeic_tests")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ToeicTest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String year;

    @Column(name = "test_number", nullable = false)
    private Integer testNumber;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 255)
    private String description;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<AudioItem> items = new ArrayList<>();
}
```

Tạo `AudioItem.java`:
```java
package com.toeic.dictation.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "audio_items")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AudioItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    @JsonIgnore
    private ToeicTest test;

    @Column(nullable = false)
    private Integer part;

    @Column(name = "item_number", nullable = false, length = 50)
    private String itemNumber;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(name = "audio_url", nullable = false)
    private String audioUrl;

    @Column(name = "total_duration", nullable = false, precision = 6, scale = 2)
    private BigDecimal totalDuration;

    @Column(name = "total_segments", nullable = false)
    @Builder.Default
    private Integer totalSegments = 0;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("segmentIndex ASC")
    @Builder.Default
    private List<AudioSegment> segments = new ArrayList<>();
}
```

Tạo `AudioSegment.java`:
```java
package com.toeic.dictation.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "audio_segments")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AudioSegment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    @JsonIgnore
    private AudioItem item;

    @Column(name = "segment_index", nullable = false)
    private Integer segmentIndex;

    @Column(length = 50)
    private String speaker;

    @Column(name = "start_time", nullable = false, precision = 6, scale = 2)
    private BigDecimal startTime;

    @Column(name = "end_time", nullable = false, precision = 6, scale = 2)
    private BigDecimal endTime;

    @Column(name = "full_transcript", nullable = false, columnDefinition = "TEXT")
    private String fullTranscript;

    @Column(name = "total_words", nullable = false)
    private Integer totalWords;

    @Column(name = "keyword_count", nullable = false)
    private Integer keywordCount;

    @Column(name = "tokens_json", nullable = false, columnDefinition = "JSON")
    private String tokensJson;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

Tạo `StudyHistory.java`:
```java
package com.toeic.dictation.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "study_histories")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class StudyHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private AudioItem item;

    @Column(nullable = false, length = 30)
    private String mode; // MEDIUM, HARD, FULL_SENTENCE

    @Column(name = "accuracy_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal accuracyRate;

    @Column(name = "replays_count", nullable = false)
    @Builder.Default
    private Integer replaysCount = 0;

    @Column(name = "wrong_segments_count", nullable = false)
    @Builder.Default
    private Integer wrongSegmentsCount = 0;

    @Column(name = "details_json", columnDefinition = "JSON")
    private String detailsJson;

    @Column(name = "completed_at", insertable = false, updatable = false)
    private LocalDateTime completedAt;
}
```

- [ ] **Step 3: Tạo các Spring Data Repositories**

Tạo 5 interfaces:
- `UserRepository`:
  - `Optional<User> findByUsername(String username)`
  - `Optional<User> findByEmail(String email)`
  - `Optional<User> findByUsernameOrEmail(String username, String email)`
  - `boolean existsByUsername(String username)`
  - `boolean existsByEmail(String email)`
- `ToeicTestRepository`:
  - `List<ToeicTest> findAllByOrderByYearDescTestNumberAsc()`
- `AudioItemRepository`:
  - `List<AudioItem> findByTestIdOrderByPartAscItemNumberAsc(Long testId)`
  - `List<AudioItem> findByTestIdAndPartOrderByItemNumberAsc(Long testId, Integer part)`
- `AudioSegmentRepository`:
  - `List<AudioSegment> findByItemIdOrderBySegmentIndexAsc(Long itemId)`
- `StudyHistoryRepository`:
  - `List<StudyHistory> findByUserIdOrderByCompletedAtDesc(Long userId)`
  - `List<StudyHistory> findByUserIdAndItemIdOrderByCompletedAtDesc(Long userId, Long itemId)`

- [ ] **Step 4: Chạy test kiểm tra Repository**

```powershell
cd d:\Dictation_TOEIC\backend
.\mvnw.cmd test -Dtest=RepositoryIntegrationTests
```
Kỳ vọng: BUILD SUCCESS, tất cả assertions về seed data pass.

- [ ] **Step 5: Git commit task 2**

```bash
git add backend/src/main/java/com/toeic/dictation/model/ backend/src/main/java/com/toeic/dictation/repository/ backend/src/test/java/com/toeic/dictation/repository/
git commit -m "feat(backend): implement jpa entities and repositories matching mysql schema"
```

---

### Task 3: Xây dựng Module Authentication & JWT

**Files:**
- Create: `backend/src/main/java/com/toeic/dictation/security/JwtTokenProvider.java`
- Create: `backend/src/main/java/com/toeic/dictation/security/CustomUserDetailsService.java`
- Create: `backend/src/main/java/com/toeic/dictation/security/JwtAuthenticationFilter.java`
- Create: `backend/src/main/java/com/toeic/dictation/security/SecurityConfig.java`
- Create: `backend/src/main/java/com/toeic/dictation/dto/auth/RegisterRequest.java`
- Create: `backend/src/main/java/com/toeic/dictation/dto/auth/LoginRequest.java`
- Create: `backend/src/main/java/com/toeic/dictation/dto/auth/AuthResponse.java`
- Create: `backend/src/main/java/com/toeic/dictation/service/AuthService.java`
- Create: `backend/src/main/java/com/toeic/dictation/controller/AuthController.java`
- Create: `backend/src/test/java/com/toeic/dictation/controller/AuthControllerTests.java`

**Interfaces:**
- Consumes: `UserRepository`, `BCryptPasswordEncoder`, cấu hình `jwt.secret` và `jwt.expiration-ms`.
- Produces:
  - `POST /api/auth/register` (trả về 201 Created + AuthResponse kèm Bearer JWT Token).
  - `POST /api/auth/login` (trả về 200 OK + AuthResponse kèm Bearer JWT Token).
  - `GET /api/auth/me` (trả về profile người dùng hiện tại dựa trên Bearer Token).

- [ ] **Step 1: Viết test cho API Auth (Register, Login thành công và Login sai mật khẩu)**

Tạo `backend/src/test/java/com/toeic/dictation/controller/AuthControllerTests.java`:
```java
package com.toeic.dictation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.toeic.dictation.dto.auth.LoginRequest;
import com.toeic.dictation.dto.auth.RegisterRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AuthControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Should successfully login with seed demo user")
    void testLoginDemoUser() throws Exception {
        LoginRequest req = new LoginRequest("demo_user", "password123");
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.username").value("demo_user"));
    }

    @Test
    @DisplayName("Should reject login with wrong password")
    void testLoginWrongPassword() throws Exception {
        LoginRequest req = new LoginRequest("demo_user", "wrongpassword");
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }
}
```

- [ ] **Step 2: Viết JwtTokenProvider và CustomUserDetailsService**

Tạo `JwtTokenProvider.java`:
- Sử dụng `Jwts.builder()` của JJWT 0.12.x với key tạo từ `Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret))`.
- Phương thức `generateToken(Authentication authentication)` hoặc `generateToken(String username)`.
- Phương thức `getUsernameFromToken(String token)`.
- Phương thức `validateToken(String token)` bắt `ExpiredJwtException`, `MalformedJwtException`, `SecurityException`.

Tạo `CustomUserDetailsService.java`:
- Implement `UserDetailsService`, load user bằng `userRepository.findByUsernameOrEmail(username, username)`.
- Trả về Spring Security `UserDetails` với quyền từ role của user.

- [ ] **Step 3: Cấu hình Spring Security 6 & CORS**

Tạo `SecurityConfig.java`:
- Khởi tạo bean `SecurityFilterChain`:
  - `csrf(csrf -> csrf.disable())`
  - `cors(cors -> cors.configurationSource(corsConfigurationSource()))` hỗ trợ requests từ `http://localhost:5173`, `http://localhost:3000`.
  - `sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))`
  - `authorizeHttpRequests(auth -> auth.requestMatchers("/api/auth/**", "/audio/**", "/api/tests/**", "/api/items/**").permitAll().anyRequest().authenticated())`
  - Thêm `JwtAuthenticationFilter` trước `UsernamePasswordAuthenticationFilter`.
- Khởi tạo bean `PasswordEncoder` là `BCryptPasswordEncoder`.
- Khởi tạo bean `AuthenticationManager`.

- [ ] **Step 4: Viết AuthService và AuthController**

- Xử lý `register(RegisterRequest req)`: kiểm tra trùng lặp `username`/`email`, mã hóa `req.getPassword()`, lưu vào `users`, tạo JWT token trả về.
- Xử lý `login(LoginRequest req)`: xác thực qua `AuthenticationManager.authenticate(...)`, tạo token và trả về `AuthResponse`.
- Xử lý `getProfile(Authentication auth)`: trả về thông tin user hiện tại.

- [ ] **Step 5: Chạy test AuthController**

```powershell
cd d:\Dictation_TOEIC\backend
.\mvnw.cmd test -Dtest=AuthControllerTests
```
Kỳ vọng: BUILD SUCCESS, tất cả test đăng nhập đăng ký pass.

- [ ] **Step 6: Git commit task 3**

```bash
git add backend/src/main/java/com/toeic/dictation/security/ backend/src/main/java/com/toeic/dictation/dto/auth/ backend/src/main/java/com/toeic/dictation/service/AuthService.java backend/src/main/java/com/toeic/dictation/controller/AuthController.java backend/src/test/java/com/toeic/dictation/controller/AuthControllerTests.java
git commit -m "feat(backend): implement jwt authentication and registration endpoints"
```

---

### Task 4: Xây dựng RESTful API Dữ liệu Bài học & Static Audio Serving

**Files:**
- Create: `backend/src/main/java/com/toeic/dictation/config/WebMvcConfig.java`
- Create: `backend/src/main/java/com/toeic/dictation/dto/toeic/ToeicTestDto.java`
- Create: `backend/src/main/java/com/toeic/dictation/dto/toeic/AudioItemSummaryDto.java`
- Create: `backend/src/main/java/com/toeic/dictation/dto/toeic/AudioItemDetailDto.java`
- Create: `backend/src/main/java/com/toeic/dictation/dto/toeic/AudioSegmentDto.java`
- Create: `backend/src/main/java/com/toeic/dictation/service/ToeicService.java`
- Create: `backend/src/main/java/com/toeic/dictation/controller/ToeicController.java`
- Create: `backend/src/test/java/com/toeic/dictation/controller/ToeicControllerTests.java`

**Interfaces:**
- Consumes: `ToeicTestRepository`, `AudioItemRepository`, `AudioSegmentRepository`, thư mục `data_pipeline/sample_data/`.
- Produces:
  - `GET /api/tests`: Danh sách các đề thi kèm số lượng bài nghe.
  - `GET /api/tests/{testId}/items`: Danh sách các bài nghe của đề (hỗ trợ filter `?part=3` hoặc `?part=4`).
  - `GET /api/items/{id}`: Chi tiết bài nghe gồm thông tin tổng, audio URL, danh sách các segments kèm `tokens_json` parsed.
  - `GET /audio/{filename}`: Phục vụ trực tiếp file MP3 chuẩn `audio/mpeg` cho trình duyệt/player.

- [ ] **Step 1: Viết test cho ToeicController và static audio serving**

Tạo `backend/src/test/java/com/toeic/dictation/controller/ToeicControllerTests.java`:
```java
package com.toeic.dictation.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class ToeicControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Should return list of tests")
    void testGetTests() throws Exception {
        mockMvc.perform(get("/api/tests"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("ETS 2024 - Test 1"));
    }

    @Test
    @DisplayName("Should return item details with segments and parsed tokens")
    void testGetItemDetails() throws Exception {
        mockMvc.perform(get("/api/items/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.part").value(3))
                .andExpect(jsonPath("$.segments.length()").value(7))
                .andExpect(jsonPath("$.segments[0].tokens").isArray());
    }

    @Test
    @DisplayName("Should serve static audio mp3 file")
    void testServeAudioFile() throws Exception {
        mockMvc.perform(get("/audio/ets2024_test1_part3_q32_34.mp3"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "audio/mpeg"));
    }
}
```

- [ ] **Step 2: Cấu hình ResourceHandler trong WebMvcConfig**

Tạo `WebMvcConfig.java`:
```java
package com.toeic.dictation.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.audio-dir:../data_pipeline/sample_data/}")
    private String audioDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String absolutePath = Paths.get(audioDir).toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler("/audio/**")
                .addResourceLocations(absolutePath.endsWith("/") ? absolutePath : absolutePath + "/");
    }
}
```

- [ ] **Step 3: Tạo DTOs và ToeicService**

Tạo DTOs:
- `ToeicTestDto`: id, year, testNumber, title, description, itemCount.
- `AudioItemSummaryDto`: id, part, itemNumber, title, audioUrl, totalDuration, totalSegments.
- `AudioItemDetailDto`: id, testId, testTitle, part, itemNumber, title, audioUrl, totalDuration, totalSegments, `List<AudioSegmentDto> segments`.
- `AudioSegmentDto`: id, segmentIndex, speaker, startTime, endTime, fullTranscript, totalWords, keywordCount, `Object tokens` (parse `tokensJson` thành JSON Tree hoặc DTO).

Xây dựng logic trong `ToeicService`:
- `getAllTests()`
- `getItemsByTest(Long testId, Integer part)`
- `getItemDetail(Long itemId)` (tìm item, nạp danh sách segments sắp xếp theo `segmentIndex`, parse chuỗi `tokensJson` bằng Jackson `ObjectMapper`).

- [ ] **Step 4: Tạo ToeicController**

Tạo `ToeicController.java` ánh xạ các endpoint:
- `GET /api/tests`
- `GET /api/tests/{testId}/items`
- `GET /api/items/{id}`

- [ ] **Step 5: Chạy test ToeicController**

```powershell
cd d:\Dictation_TOEIC\backend
.\mvnw.cmd test -Dtest=ToeicControllerTests
```
Kỳ vọng: BUILD SUCCESS, tất cả assertions về đề thi, segments và audio stream pass.

- [ ] **Step 6: Git commit task 4**

```bash
git add backend/src/main/java/com/toeic/dictation/config/ backend/src/main/java/com/toeic/dictation/dto/toeic/ backend/src/main/java/com/toeic/dictation/service/ToeicService.java backend/src/main/java/com/toeic/dictation/controller/ToeicController.java backend/src/test/java/com/toeic/dictation/controller/ToeicControllerTests.java
git commit -m "feat(backend): implement tests, items, segments api and audio resource streaming"
```

---

### Task 5: Xây dựng Thuật toán Chấm điểm Dictation, API Nộp bài & Lưu Lịch sử

**Files:**
- Create: `backend/src/main/java/com/toeic/dictation/service/DictationScoringService.java`
- Create: `backend/src/main/java/com/toeic/dictation/dto/study/SubmitStudyRequest.java`
- Create: `backend/src/main/java/com/toeic/dictation/dto/study/SubmitStudyResponse.java`
- Create: `backend/src/main/java/com/toeic/dictation/dto/study/StudyHistoryDto.java`
- Create: `backend/src/main/java/com/toeic/dictation/service/StudyService.java`
- Create: `backend/src/main/java/com/toeic/dictation/controller/StudyController.java`
- Create: `backend/src/test/java/com/toeic/dictation/service/DictationScoringServiceTests.java`
- Create: `backend/src/test/java/com/toeic/dictation/controller/StudyControllerTests.java`

**Interfaces:**
- Consumes: Dữ liệu segment từ `AudioSegmentRepository`, thông tin đăng nhập của user từ `Authentication`, DTO bài nộp từ client.
- Produces:
  - Thuật toán so khớp chuỗi/từ vựng (bỏ qua dấu câu, case-insensitive, tính % accuracy).
  - `POST /api/study/submit` (chấm điểm, lưu bản ghi vào `study_histories`, trả về chi tiết đúng/sai từng từ/câu).
  - `GET /api/study/history` (danh sách lịch sử học tập của user đăng nhập).
  - `GET /api/study/history/{id}` (chi tiết lượt làm bài).

- [ ] **Step 1: Viết test cho DictationScoringService**

Tạo `backend/src/test/java/com/toeic/dictation/service/DictationScoringServiceTests.java`:
```java
package com.toeic.dictation.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class DictationScoringServiceTests {

    private final DictationScoringService scoringService = new DictationScoringService();

    @Test
    @DisplayName("Should normalize word by trimming and stripping punctuation")
    void testNormalizeWord() {
        assertEquals("office", scoringService.normalizeWord("Office,"));
        assertEquals("toner", scoringService.normalizeWord("\"toner\"!"));
        assertEquals("dont", scoringService.normalizeWord("don't"));
    }

    @Test
    @DisplayName("Should accurately compare words case-insensitively without punctuation")
    void testMatchWord() {
        assertTrue(scoringService.isWordMatch("Hello", "hello!"));
        assertTrue(scoringService.isWordMatch("supplies...", "Supplies"));
        assertFalse(scoringService.isWordMatch("supply", "supplies"));
    }

    @Test
    @DisplayName("Should calculate correct accuracy percentage")
    void testCalculateAccuracy() {
        // 8 correct out of 10 blanks -> 80.00%
        double acc = scoringService.calculateAccuracy(8, 10);
        assertEquals(80.0, acc, 0.01);
    }
}
```

- [ ] **Step 2: Viết test cho StudyController (Submit & Query History)**

Tạo `backend/src/test/java/com/toeic/dictation/controller/StudyControllerTests.java`:
- Kiểm tra `POST /api/study/submit` yêu cầu xác thực JWT (401 nếu chưa đăng nhập).
- Kiểm tra `POST /api/study/submit` với Bearer token trả về kết quả 200 OK kèm `accuracyRate`.
- Kiểm tra `GET /api/study/history` trả về danh sách lịch sử nộp bài của user.

- [ ] **Step 3: Cài đặt DictationScoringService**

Xây dựng logic chuẩn hóa và tính điểm:
```java
package com.toeic.dictation.service;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class DictationScoringService {

    public String normalizeWord(String word) {
        if (word == null) return "";
        // Loại bỏ toàn bộ ký tự không phải chữ cái hoặc số
        return word.trim().toLowerCase().replaceAll("[^a-zA-Z0-9]", "");
    }

    public boolean isWordMatch(String userWord, String targetWord) {
        return normalizeWord(userWord).equals(normalizeWord(targetWord));
    }

    public double calculateAccuracy(int correctWords, int totalWords) {
        if (totalWords <= 0) return 100.0;
        double rate = ((double) correctWords / totalWords) * 100.0;
        return BigDecimal.valueOf(rate).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}
```

- [ ] **Step 4: Cài đặt StudyService và StudyController**

Tạo DTOs:
- `SubmitStudyRequest`: `itemId`, `mode` (`MEDIUM`, `HARD`, `FULL_SENTENCE`), `replaysCount`, `List<SegmentAnswerDto> answers`.
- `SegmentAnswerDto`: `segmentId`, `List<WordAnswerDto> wordAnswers` hoặc `fullText`.
- `SubmitStudyResponse`: `historyId`, `accuracyRate`, `totalWords`, `correctWords`, `wrongSegmentsCount`, `List<SegmentResultDto> results`.

Xây dựng `StudyService`:
- Nạp các segments của item từ database.
- Duyệt qua từng segment và so sánh câu trả lời của học viên với `full_transcript` / `tokens_json`.
- Tính tổng số từ cần điền, số từ gõ đúng, số câu có lỗi sai.
- Lưu bản ghi vào bảng `study_histories`.
- Trả về response chi tiết cho frontend highlight từ đúng (xanh)/sai (đỏ).

Xây dựng `StudyController`:
- `POST /api/study/submit`
- `GET /api/study/history`
- `GET /api/study/history/{id}`

- [ ] **Step 5: Chạy toàn bộ test suite**

```powershell
cd d:\Dictation_TOEIC\backend
.\mvnw.cmd test
```
Kỳ vọng: BUILD SUCCESS, tất cả unit test và integration test đều pass.

- [ ] **Step 6: Git commit task 5**

```bash
git add backend/src/main/java/com/toeic/dictation/service/DictationScoringService.java backend/src/main/java/com/toeic/dictation/dto/study/ backend/src/main/java/com/toeic/dictation/service/StudyService.java backend/src/main/java/com/toeic/dictation/controller/StudyController.java backend/src/test/java/com/toeic/dictation/
git commit -m "feat(backend): implement dictation scoring engine, submission api and history tracking"
```

---

### Task 6: Kiểm thử E2E Toàn diện Backend & Bàn giao Tài liệu API

**Files:**
- Create: `backend/src/test/java/com/toeic/dictation/EndToEndApiIntegrationTests.java`
- Modify: `PROJECT_STATE.md` (Cập nhật tiến độ hoàn thành Phase 2)

**Interfaces:**
- Consumes: Toàn bộ các API Auth, Tests, Items, Audio và Study Submission.
- Produces: Test kịch bản người dùng hoàn chỉnh từ đăng ký $\rightarrow$ đăng nhập $\rightarrow$ lấy bài nghe $\rightarrow$ nộp bài chép chính tả $\rightarrow$ kiểm tra lịch sử.

- [ ] **Step 1: Viết test tích hợp E2E toàn bộ luồng nghiệp vụ**

Tạo `EndToEndApiIntegrationTests.java`:
1. Đăng ký tài khoản mới `student_01` qua `POST /api/auth/register`.
2. Đăng nhập nhận JWT Token.
3. Dùng token gọi `GET /api/tests` lấy danh sách đề thi.
4. Lấy chi tiết bài nghe Part 3 (id=1) qua `GET /api/items/1`.
5. Nộp bài dictation qua `POST /api/study/submit` với độ chính xác giả định 100%.
6. Kiểm tra `GET /api/study/history` xác nhận lịch sử được lưu chuẩn xác.

- [ ] **Step 2: Chạy test E2E**

```powershell
cd d:\Dictation_TOEIC\backend
.\mvnw.cmd test -Dtest=EndToEndApiIntegrationTests
```
Kỳ vọng: BUILD SUCCESS.

- [ ] **Step 3: Cập nhật tài liệu trạng thái dự án PROJECT_STATE.md**

Đánh dấu hoàn thành các checkbox của Giai đoạn 2 trong `PROJECT_STATE.md`.

- [ ] **Step 4: Git commit task 6**

```bash
git add backend/src/test/java/com/toeic/dictation/EndToEndApiIntegrationTests.java PROJECT_STATE.md
git commit -m "test(backend): add end-to-end integration tests and update project state"
```
