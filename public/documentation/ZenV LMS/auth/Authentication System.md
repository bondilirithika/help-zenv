## Table of Contents

1. Authentication Architecture
2. Username/Password Authentication
3. SAML Authentication
4. JWT Token Management
5. Frontend Authentication Flow
6. Multi-Tenant Security Model
7. API Security Implementation
8. Configuration Guide
9. Troubleshooting

**Primary Functions:**

- **User Authentication**: Validates user identities through multiple methods
- **Multi-Tenant Isolation**: Ensures complete data separation between different organizations
- **Single Sign-On (SSO)**: Integrates with external identity providers via SAML
- **Session Management**: Maintains secure, stateless user sessions using JWT tokens
- **Role-Based Access Control**: Enforces permissions based on user roles

### Key Benefits

- **Flexibility**: Supports both traditional login and modern SSO
- **Security**: Implements industry-standard security practices
- **Scalability**: Multi-tenant architecture supports multiple organizations
- **Integration-Ready**: Easy integration with existing identity providers
- **Stateless**: JWT-based sessions for better performance and scalability

## Authentication Architecture

### High-Level System Flow

The authentication system follows a distributed architecture where different components handle specific responsibilities:

```
┌─────────────────────────────────────────────────────────────┐
│                    RFID Authentication System              │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    ┌─────▼─────┐      ┌──────▼──────┐     ┌─────▼─────┐
    │ Frontend  │      │Auth Server  │     │ Backend   │
    │ (React)   │◄────►│(Spring Sec) │◄───►│ Services  │
    └───────────┘      └─────────────┘     └───────────┘
          │                   │                   │
          ▼                   ▼                   ▼
    ┌───────────┐      ┌─────────────┐     ┌───────────┐
    │ JWT Token │      │ SAML        │     │ Database  │
    │ Storage   │      │ Providers   │     │ (Multi-   │
    │           │      │             │     │ Tenant)   │
    └───────────┘      └─────────────┘     └───────────┘
```

### Component Responsibilities

**Frontend (React)**: Handles user interface, token management, and client-side authentication state **Authentication Server**: Processes login requests, validates credentials, and issues tokens 
**Backend Services**: Protected application resources that require authentication
**JWT Tokens**: Stateless session tokens containing user information and permissions 
**SAML Providers**: External identity providers for enterprise SSO 
**Database**: Stores user credentials, roles, and tenant-specific configuration

## Username/Password Authentication

### How Traditional Login Works

Traditional authentication follows the classic credential validation pattern but with modern security enhancements:

**The Process:**

1. User submits credentials via a secure form
2. Server validates credentials against encrypted database records
3. Upon success, a JWT token is generated with user context
4. Token is returned to the client for subsequent requests

### Backend Implementation

The authentication process is handled by two main components working together:

```java
// AuthController.java - Handles HTTP requests
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @RequestBody LoginRequest loginRequest) {
        
        // Delegate authentication logic to service layer
        ApiResponse<LoginResponse> response = 
            authService.authenticateUser(loginRequest);
        
        return ResponseEntity.ok(response);
    }
}
```

**What's happening here:**

- The controller acts as the HTTP interface, receiving login requests
- It delegates the actual authentication logic to the service layer
- Returns a standardized API response format

```java
// AuthService.java - Core authentication logic
@Service
public class AuthService {
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    @Autowired
    private UserRepository userRepository;
    
    public ApiResponse<LoginResponse> authenticateUser(LoginRequest loginRequest) {
        try {
            // Step 1: Use Spring Security's authentication manager
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginRequest.getEmail(),
                    loginRequest.getPassword()
                )
            );
            
            // Step 2: Set authentication in security context
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            // Step 3: Retrieve user details and tenant information
            User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
            
            // Step 4: Generate JWT token with user context
            String token = jwtTokenProvider.generateToken(user);
            
            // Step 5: Build response with user info and token
            LoginResponse loginResponse = new LoginResponse(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                token,
                jwtTokenProvider.getExpirationTime()
            );
            
            return ApiResponse.success("Login successful", loginResponse);
            
        } catch (BadCredentialsException e) {
            return ApiResponse.error("Invalid email or password");
        } catch (Exception e) {
            return ApiResponse.error("Authentication failed: " + e.getMessage());
        }
    }
}
```

**Key Security Features:**

- **Password Hashing**: Passwords are never stored in plain text
- **Authentication Manager**: Spring Security handles credential validation
- **Security Context**: Establishes user session context
- **Error Handling**: Generic error messages prevent information disclosure

### Why This Approach Works

1. **Separation of Concerns**: Controller handles HTTP, Service handles business logic
2. **Spring Security Integration**: Leverages proven authentication mechanisms
3. **Stateless Design**: JWT tokens eliminate server-side session storage
4. **Error Safety**: Prevents credential enumeration attacks

## SAML Authentication

### Understanding SAML SSO

SAML (Security Assertion Markup Language) enables Single Sign-On by allowing users to authenticate once with their organization's identity provider and access multiple applications without re-entering credentials.

**The SAML Flow:**

1. User selects their organization's identity provider
2. Application redirects user to corporate login page
3. User authenticates with corporate credentials
4. Identity provider sends back encrypted user information
5. Application maps corporate roles to local permissions
6. User gains access with appropriate role-based permissions

### SAML Architecture Components

The SAML implementation uses a modular design where each component has a specific responsibility:

```
┌───────────────────────────────────────────────────────────┐
│                  SAML Authentication Flow                  │
└───────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ SAML Admin      │   │ Registration    │   │ Universal       │
│ Controller      │   │ Repository      │   │ Authorization   │
│ (Config API)    │   │ (Storage)       │   │ Service         │
└─────────────────┘   └─────────────────┘   └─────────────────┘
           │                    │                    │
           └────────────────────┼────────────────────┘
                                ▼
                   ┌─────────────────────┐
                   │ Registration        │
                   │ Builder             │
                   │ (Spring Security)   │
                   └─────────────────────┘
                                │
                                ▼
                   ┌─────────────────────┐
                   │ Configuration       │
                   │ Refresher           │
                   │ (Dynamic Updates)   │
                   └─────────────────────┘
```

### SAML Provider Configuration

SAML providers are configured through the admin interface and stored with comprehensive metadata:

```java
// SamlProviderConfig.java - Configuration model
public class SamlProviderConfig {
    // Basic identification
    private String id;              // Unique identifier
    private String displayName;     // Name shown on login page
    private String tenantId;        // Associated tenant
    private boolean enabled;        // Whether the provider is active
    
    // Service Provider (Our Application) Configuration
    private String spEntityId;      // Our application's entity ID
    private String spCertificate;   // Our certificate for signing
    private String spPrivateKey;    // Our private key for signing
    
    // Identity Provider Configuration
    private String idpEntityId;     // IdP's entity ID
    private String idpLoginUrl;     // IdP's SSO URL
    private String idpCertificate;  // IdP's certificate for verification
    private String metadataXml;     // Raw IdP metadata
    
    // SAML Protocol Configuration
    private String nameIdFormat;         // Format for NameID
    private boolean signAuthnRequests;   // Whether to sign requests
    
    // Authorization mapping
    private AuthorizationConfig authorizationConfig; // Role mapping config
}
```

**Configuration Elements Explained:**

- **Entity IDs**: Unique identifiers that distinguish our app from the identity provider
- **Certificates**: Used for signing and verifying SAML assertions
- **Metadata**: Contains all the technical details needed for SAML communication
- **Authorization Config**: Maps corporate roles (like "Engineering-Manager") to app roles (like "ADMIN")

### SAML Registration Builder

The registration builder creates Spring Security SAML configurations dynamically:

```java
// SamlRegistrationBuilder.java - Dynamic SAML setup
@Component
public class SamlRegistrationBuilder {
    
    public RelyingPartyRegistration buildRegistration(SamlProviderConfig config) {
        return RelyingPartyRegistration
            .withRegistrationId(config.getId())
            .entityId(config.getSpEntityId())
            .signingX509Credentials(c -> c.add(loadCredential(config.getSpCertificate(), 
                                                             config.getSpPrivateKey())))
            .assertionConsumerServiceLocation("/api/auth/saml2/sso/{registrationId}")
            .assertingPartyDetails(party -> party
                .entityId(config.getIdpEntityId())
                .singleSignOnServiceLocation(config.getIdpLoginUrl())
                .wantAuthnRequestsSigned(config.isSignAuthnRequests())
                .verificationX509Credentials(c -> c.add(loadCertificate(config.getIdpCertificate())))
            )
            .build();
    }
}
```

**What this accomplishes:**

- **Dynamic Configuration**: SAML providers can be added/modified without code changes
- **Security Setup**: Handles certificate loading and signature verification
- **Protocol Compliance**: Ensures proper SAML 2.0 protocol implementation

## JWT Token Management

### Understanding JWT Tokens

JWT (JSON Web Tokens) provide a stateless way to maintain user sessions. Unlike traditional session cookies, JWTs contain all necessary user information, eliminating the need for server-side session storage.

**JWT Structure:**

```
Header.Payload.Signature
```

### Token Claims and Content

Our JWT tokens contain specific claims that provide user context and security:

```java
// JwtTokenProvider.java - Token generation
@Component
public class JwtTokenProvider {
    
    private String jwtSecret;
    private int jwtExpirationInMs;
    
    public String generateToken(String email, String role, String tenantId) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(jwtExpirationInMs);
        
        return Jwts.builder()
            .subject(email)                    // User identifier
            .claim("role", role)               // User permissions
            .claim("tenantId", tenantId)       // Tenant isolation
            .issuedAt(Date.from(now))          // Token creation time
            .expiration(Date.from(expiry))     // Token expiration
            .signWith(getSigningKey(), SignatureAlgorithm.HS256)  // Digital signature
            .compact();
    }
}
```

**Token Claims Explained:**

- **Subject (sub)**: User's email address as the primary identifier
- **Role**: User's permission level (USER, ADMIN, SUPER_ADMIN)
- **TenantId**: Ensures multi-tenant data isolation
- **Issued At (iat)**: Prevents token replay attacks
- **Expiration (exp)**: Limits token lifetime for security

### Token Validation and Security

Every incoming request with a JWT token goes through comprehensive validation:

```java
// JwtTokenProvider.java - Token validation
public boolean validateToken(String token) {
    try {
        Jwts.parser()
            .verifyWith(getSigningKey())  // Verify signature
            .build()
            .parseSignedClaims(token);    // Parse and validate
        return true;
        
    } catch (SignatureException e) {
        log.error("Invalid JWT signature: {}", e.getMessage());
    } catch (MalformedJwtException e) {
        log.error("Invalid JWT token: {}", e.getMessage());
    } catch (ExpiredJwtException e) {
        log.error("JWT token is expired: {}", e.getMessage());
    } catch (UnsupportedJwtException e) {
        log.error("JWT token is unsupported: {}", e.getMessage());
    } catch (IllegalArgumentException e) {
        log.error("JWT claims string is empty: {}", e.getMessage());
    }
    return false;
}
```

**Security Validations:**

1. **Signature Verification**: Ensures token wasn't tampered with
2. **Expiration Check**: Prevents use of old tokens
3. **Format Validation**: Ensures token structure is correct
4. **Claims Validation**: Verifies required information is present

### JWT Authentication Filter

The JWT filter intercepts every HTTP request to handle authentication:

```java
// JwtAuthenticationFilter.java - Request interception
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtTokenProvider jwtTokenProvider;
    private final TenantIdentificationService tenantService;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                  HttpServletResponse response,
                                  FilterChain filterChain) throws ServletException, IOException {
        try {
            // Step 1: Extract tenant information from request
            String tenantId = tenantService.extractTenantId(request);
            request.setAttribute("TENANT_ID", tenantId);
            
            // Step 2: Extract JWT token from Authorization header
            String jwt = getJwtFromRequest(request);
            
            if (StringUtils.hasText(jwt) && jwtTokenProvider.validateToken(jwt)) {
                // Step 3: Create authentication object from token
                Authentication authentication = jwtTokenProvider.getAuthentication(jwt);
                
                // Step 4: Set authentication in Spring Security context
                SecurityContextHolder.getContext().setAuthentication(authentication);
                
                // Step 5: Verify tenant isolation
                String tokenTenantId = jwtTokenProvider.getTenantFromToken(jwt);
                if (!tokenTenantId.equals(tenantId)) {
                    log.warn("Token tenant ID ({}) doesn't match request tenant ID ({})",
                            tokenTenantId, tenantId);
                    // Could throw exception here for strict enforcement
                }
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context", ex);
        }
        
        // Continue with request processing
        filterChain.doFilter(request, response);
    }
    
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);  // Remove "Bearer " prefix
        }
        return null;
    }
}
```

**Filter Responsibilities:**

1. **Token Extraction**: Gets JWT from the Authorization header
2. **Token Validation**: Ensures token is valid and not expired
3. **Authentication Setup**: Creates Spring Security authentication context
4. **Tenant Verification**: Ensures multi-tenant security boundaries
5. **Request Processing**: Allows request to continue if authenticated

## Frontend Authentication Flow

### React Authentication Context

The frontend uses React Context API to manage authentication state across the entire application:

```javascript
// AuthContext.js - Global authentication state management
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Initialize authentication state when app loads
    useEffect(() => {
        const initAuth = async () => {
            try {
                const token = localStorage.getItem('jwt');
                if (token) {
                    // Validate stored token with backend
                    const response = await api.get('/api/auth/validate', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    if (response.data.success) {
                        // Token is valid, decode user information
                        const decoded = jwtDecode(token);
                        setUser({
                            email: decoded.sub,
                            role: decoded.role,
                            tenantId: decoded.tenantId,
                            ...response.data.data  // Additional backend data
                        });
                    } else {
                        // Token invalid, clear storage
                        localStorage.removeItem('jwt');
                    }
                }
            } catch (err) {
                console.error('Auth initialization error:', err);
                localStorage.removeItem('jwt');
            } finally {
                setLoading(false);
            }
        };
        
        initAuth();
    }, []);
```

**Authentication Context Features:**

- **Persistent State**: Maintains authentication across browser sessions
- **Token Validation**: Verifies stored tokens are still valid
- **Automatic Cleanup**: Removes invalid tokens automatically
- **Loading State**: Prevents UI flicker during initialization

### Login Implementation

The login function handles both success and failure scenarios:

```javascript
// Login function - Handles credential validation
const login = async (credentials) => {
    try {
        const response = await api.post('/api/login', credentials);
        
        if (response.data.success) {
            const { token, email, role } = response.data.data;
            
            // Store token securely
            localStorage.setItem('jwt', token);
            
            // Extract tenant information from token
            const decoded = jwtDecode(token);
            sessionStorage.setItem('tenantId', decoded.tenantId);
            
            // Update application state
            setUser({
                email,
                role,
                tenantId: decoded.tenantId
            });
            
            return { success: true };
        } else {
            return { success: false, error: response.data.error };
        }
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            error: error.response?.data?.error || 'Login failed'
        };
    }
};
```

**Security Considerations:**

- **Secure Storage**: Uses localStorage for token persistence
- **Error Handling**: Provides user-friendly error messages
- **State Synchronization**: Updates both local and session storage
- **Graceful Degradation**: Handles network and server errors

### Login Page with SAML Support

The login page dynamically displays available authentication options:

```javascript
// Login.jsx - Multi-method authentication interface
const Login = () => {
    const { login } = useContext(AuthContext);
    const [samlProviders, setSamlProviders] = useState([]);
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);
    
    // Load available SAML providers for the current tenant
    useEffect(() => {
        const fetchSamlProviders = async () => {
            try {
                const response = await api.get('/api/auth/tenant-providers');
                if (response.data.success) {
                    setSamlProviders(response.data.data);
                }
            } catch (err) {
                console.error('Error fetching SAML providers:', err);
            }
        };
        
        fetchSamlProviders();
    }, []);
    
    // Handle SAML authentication
    const handleSamlLogin = (providerId) => {
        // Redirect to SAML authentication endpoint
        window.location.href = `/api/auth/login/saml2/${providerId}`;
    };
    
    return (
        <div className="login-container">
            <h2>Login</h2>
            
            {/* Traditional username/password form */}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={credentials.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={credentials.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                {error && <div className="error-message">{error}</div>}
                <button type="submit">Login</button>
            </form>
            
            {/* Dynamic SAML provider buttons */}
            {samlProviders.length > 0 && (
                <div className="saml-providers">
                    <h3>Or login with:</h3>
                    {samlProviders.map(provider => (
                        <button
                            key={provider.id}
                            onClick={() => handleSamlLogin(provider.id)}
                            className="saml-button"
                        >
                            {provider.displayName}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
```

**UI Features:**

- **Dynamic Provider Loading**: Shows only available SAML providers for current tenant
- **Unified Interface**: Both traditional and SSO login in one place
- **Error Display**: Shows authentication errors to users
- **Responsive Design**: Works on different screen sizes

### Protected Route Implementation

Protected routes ensure only authenticated users can access certain pages:

```javascript
// ProtectedRoute.jsx - Route-level access control
const ProtectedRoute = ({ component: Component, requiredRole, ...rest }) => {
    const { user, loading, isAuthenticated } = useContext(AuthContext);
    
    if (loading) {
        return <div>Loading...</div>;
    }
    
    return (
        <Route
            {...rest}
            render={props => {
                // Check authentication status
                if (!isAuthenticated) {
                    return <Redirect to="/login" />;
                }
                
                // Check role-based access
                if (requiredRole && user.role !== requiredRole) {
                    return <Redirect to="/unauthorized" />;
                }
                
                // User has appropriate access
                return <Component {...props} />;
            }}
        />
    );
};
```

**Access Control Features:**

- **Authentication Check**: Ensures user is logged in
- **Role-based Authorization**: Restricts access based on user role
- **Loading State**: Prevents flicker during auth state resolution
- **Graceful Redirects**: Sends users to appropriate pages

## Multi-Tenant Security Model

### Understanding Multi-Tenancy

Multi-tenancy allows a single application instance to serve multiple organizations while maintaining complete data isolation. Each tenant (organization) has their own data, users, and configuration, but shares the same application infrastructure.

### Tenant Identification Strategy

The system uses multiple methods to identify which tenant a request belongs to:

```java
// TenantIdentificationService.java - Multi-method tenant detection
@Service
public class TenantIdentificationService {
    
    private static final Logger logger = 
        LoggerFactory.getLogger(TenantIdentificationService.class);
    
    /**
     * Extract tenant ID using multiple strategies in order of preference
     */
    public String extractTenantId(HttpServletRequest request) {
        // Strategy 1: Check HTTP header (for API clients)
        String tenantId = request.getHeader("X-Tenant-ID");
        if (tenantId != null && !tenantId.isEmpty()) {
            logger.debug("Using tenant ID from header: {}", tenantId);
            return tenantId;
        }
        
        // Strategy 2: Extract from subdomain (for web browsers)
        tenantId = extractTenantIdFromHost(request);
        if (tenantId != null && !tenantId.isEmpty()) {
            logger.debug("Using tenant ID from subdomain: {}", tenantId);
            return tenantId;
        }
        
        // Strategy 3: Default fallback for development/testing
        logger.debug("Using default tenant ID");
        return "default";
    }
    
    /**
     * Extract tenant ID from subdomain
     * Example: company1.myapp.com -> "company1"
     */
    private String extractTenantIdFromHost(HttpServletRequest request) {
        String host = request.getServerName();
        
        if (host == null || host.isEmpty() || host.equals("localhost")) {
            return null;
        }
        
        // Extract subdomain as tenant ID
        if (host.contains(".")) {
            return host.substring(0, host.indexOf('.'));
        }
        
        return null;
    }
}
```

**Tenant Identification Methods:**

1. **HTTP Header**: `X-Tenant-ID` header for API integrations
2. **Subdomain**: `tenant1.myapp.com` for web browser access
3. **Default Fallback**: Used in development environments

### Tenant Security Verification

Every authenticated request verifies that the user's token matches the requested tenant:

```java
// In JwtAuthenticationFilter.doFilterInternal() - Tenant security check
String tenantId = tenantIdentificationService.extractTenantId(request);
request.setAttribute("TENANT_ID", tenantId);

String jwt = getJwtFromRequest(request);
if (StringUtils.hasText(jwt) && jwtTokenProvider.validateToken(jwt)) {
    Authentication authentication = jwtTokenProvider.getAuthentication(jwt);
    SecurityContextHolder.getContext().setAuthentication(authentication);
    
    // CRITICAL: Verify token tenant matches request tenant
    String tokenTenantId = jwtTokenProvider.getTenantFromToken(jwt);
    if (!tokenTenantId.equals(tenantId)) {
        log.warn("Token tenant ID ({}) doesn't match request tenant ID ({})",
                tokenTenantId, tenantId);
        // In production, this could throw a SecurityException
    }
}
```

**Security Enforcement:**

- **Token Verification**: Ensures JWT token belongs to the requested tenant
- **Request Attribute**: Makes tenant ID available throughout the request lifecycle
- **Audit Logging**: Records tenant mismatch attempts for security monitoring

### Database-Level Tenant Isolation

All database queries automatically include tenant filtering to prevent cross-tenant data access:

```java
// Example: User repository with tenant isolation
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Explicit tenant filtering in queries
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.tenantId = :tenantId")
    Optional<User> findByEmailAndTenant(@Param("email") String email, 
                                      @Param("tenantId") String tenantId);
    
    // All user queries include tenant context
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId")
    List<User> findAllByTenant(@Param("tenantId") String tenantId);
}
```

**Data Isolation Features:**

- **Automatic Filtering**: All queries include tenant ID conditions
- **Explicit Parameters**: Tenant ID required for all data operations
- **No Cross-Tenant Access**: Impossible to accidentally query other tenants' data

## API Security Implementation

### Spring Security Configuration

The security configuration establishes the overall authentication and authorization framework:

```java
// SecurityConfig.java - Comprehensive security setup
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(
    securedEnabled = true,      // @Secured annotations
    jsr250Enabled = true,       // @RolesAllowed annotations
    prePostEnabled = true       // @PreAuthorize/@PostAuthorize annotations
)
public class SecurityConfig {
    
    @Autowired
    private UserDetailsService userDetailsService;
    
    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;
    
    @Autowired
    private RelyingPartyRegistrationRepository relyingPartyRegistrationRepository;
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);  // Strong hashing
    }
    
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .cors().and()
            .csrf().disable()  // Disabled for stateless JWT authentication
            .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)  // No server sessions
            .and()
            .authorizeRequests()
                // Public endpoints
                .antMatchers("/api/login", "/api/auth/custom-login", 
                           "/api/auth/tenant-providers").permitAll()
                .antMatchers("/saml2/**").permitAll()  // SAML endpoints
                
                // Role-based endpoint protection
                .antMatchers("/api/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .antMatchers("/api/user/**").hasAnyRole("USER", "ADMIN", "SUPER_ADMIN")
                
                // All other endpoints require authentication
                .anyRequest().authenticated()
            .and()
            .saml2Login(saml2 -> saml2
                .relyingPartyRegistrationRepository(relyingPartyRegistrationRepository)
            )
            // Add JWT filter before username/password authentication
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
    }
}
```

**Security Configuration Features:**

- **Stateless Sessions**: No server-side session storage
- **CORS Support**: Enables cross-origin requests for web applications
- **Role-based URLs**: Different endpoints for different user types
- **SAML Integration**: Built-in SAML 2.0 support
- **Custom JWT Filter**: Handles token-based authentication

### Method-Level Security

Controllers use fine-grained security annotations for precise access control:

```java
// Example controller with method-level security
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    
    // Only users with ADMIN role can access
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        // Implementation here
    }
    
    // Only SUPER_ADMIN can delete users
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long userId) {
        // Implementation here
    }
    
    // Complex authorization logic
    @PreAuthorize("hasRole('ADMIN') and @tenantService.canAccessTenant(authentication.name, #tenantId)")
    @GetMapping("/tenant/{tenantId}/config")
    public ResponseEntity<TenantConfig> getTenantConfig(@PathVariable String tenantI
```