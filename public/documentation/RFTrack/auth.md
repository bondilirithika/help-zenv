## Table of Contents

1. Authentication Overview
2. SAML Configuration Management
3. Authentication Flows
4. Provider Storage and Management
5. Multi-tenant Authentication Configuration
6. Admin Operations
7. Monitoring and Troubleshooting

## Authentication Overview

The RFID Admin system supports two primary authentication methods:

1. **Username/Password Authentication**: Traditional credential-based authentication
2. **SAML Single Sign-On**: Enterprise authentication through external identity providers

Both authentication methods result in a JWT (JSON Web Token) that is used for subsequent API authorization. The token contains user identity, roles, and tenant information.

## SAML Configuration Management

### SAML Provider Information

Each SAML provider requires the following information:

- **Provider ID**: Unique identifier for the provider
- **Display Name**: Name shown on login page
- **Entity ID**: The SAML entity ID for both SP (Service Provider) and IdP (Identity Provider)
- **SSO URL**: Single sign-on URL from the identity provider
- **Certificate**: X.509 certificate for verification of SAML responses
- **Tenant ID**: Associated tenant (for multi-tenant environments)

### Storage Location

SAML provider configurations are stored in:

- **YAML Configuration File**: All SAML provider configurations are stored in a YAML file
- **Cache**: In-memory cache for improved performance via `ConfigurationCacheService`
- **Runtime Registry**: Dynamic runtime registry (`SamlRegistrationRepository`) for Spring Security

### Configuration Refreshing

The system automatically refreshes SAML configuration:

- On application startup
- When a provider is added, updated, or deleted via `ProviderSavedEvent` and `ProviderDeletedEvent`
- Periodically via scheduled task (`SamlConfigurationRefresher`) with configurable interval

## Authentication Flows

### SAML Authentication Flow

1. **Provider Selection**:
   - Frontend fetches available providers from `/api/auth/tenant-providers`
   - User selects a SAML provider from the login page

2. **Authentication Initiation**:
   - Browser redirects to  `/api/auth/custom-login?provider={providerId}`
   - System generates SAML authentication request
   - User is redirected to identity provider

3. **Identity Provider Authentication**:
   - User authenticates at the identity provider
   - Identity provider generates SAML response
   - Browser is redirected back to `/login/saml2/sso/{registrationId}`

4. **SAML Response Processing**:
   - System validates SAML response signature
   - User attributes are extracted from SAML assertions
   - Role mapping is performed based on provider configuration via `UniversalAuthorizationService`

5. **JWT Token Generation**:
   - System generates JWT token with user information via `JwtTokenProvider`
   - User is redirected to frontend with token
   - Frontend stores token for subsequent API requests

### Key Endpoints

- **`/api/auth/tenant-providers`**: Returns available SAML providers for the current tenant
- **`/api/auth/custom-login`**: Endpoint to initiate SAML login with specified provider
- **`/saml2/authentication/requests/{registrationId}`**: Generates SAML authentication request
- **`/login/saml2/sso/{registrationId}`**: Processes SAML response
- **`/saml2/service-provider-metadata/{registrationId}`**: Provides metadata for service provider configuration

## Provider Storage and Management

### Storage Components

SAML provider configurations are managed through several components:

1. **Configuration Persistence Service**: Handles reading and writing provider configurations to the YAML file
2. **Configuration Cache Service**: Provides in-memory caching of provider configurations
3. **SAML Registration Repository**: Maintains Spring Security SAML registrations for runtime authentication
4. **SAML Registration Builder**: Converts provider configurations to Spring Security registrations

### YAML File Structure

The YAML file stores SAML provider configurations in the following format:

```yaml
providers:
  - id: "google-workspace"
    displayName: "Google Workspace"
    enabled: true
    tenantId: "tenant1"
    spEntityId: "https://rfid-admin.example.com/saml/sp"
    idpEntityId: "https://accounts.google.com"
    idpLoginUrl: "https://accounts.google.com/o/saml2/idp"
    idpCertificate: "-----BEGIN CERTIFICATE-----\nMIID...base64...\n-----END CERTIFICATE-----"
    nameIdFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
    signAuthnRequests: true
  - id: "azure-ad"
    displayName: "Azure AD"
    enabled: true
    # Additional provider configurations...
roles:
  - "SUPER_ADMIN"
  - "ADMIN"
  - "USER_MANAGER"
  - "MANAGER"
  - "USER"
  - "GUEST"
  - "READONLY"
```

### Configuration Events

The system uses an event-driven architecture to maintain consistency:

- **Provider Saved Event**: Triggered when a provider is created or updated
- **Provider Deleted Event**: Triggered when a provider is removed
- Event listeners update the SAML registration repository automatically

## Multi-tenant Authentication Configuration

### Tenant Identification

The system identifies tenants through:

1. **Subdomain**: First part of the hostname (e.g., `tenant1.example.com`)
2. **Request Headers**: Using `X-Tenant-ID` header
3. **Origin/Referer Headers**: Extracting tenant from request Origin or Referer headers

### Tenant-specific Providers

SAML providers can be:

- **Tenant-specific**: Available only to a specific tenant (has `tenantId` field set)

The system automatically filters available providers based on the current tenant context using `extractTenantIdFromHost` method.

### Tenant ID in JWT Tokens

Each JWT token includes:

- **Subject**: User's email address
- **Role**: User's role in the system
- **Tenant ID**: User's tenant context
- **Expiration**: Token expiration timestamp

## Admin Operations

### Managing SAML Providers

Administrators can manage SAML providers through:

1. **Admin UI**: 
   - Navigate to Admin Dashboard → Authentication
   - Forms for adding, editing, and deleting providers (`SamlProviderForm.js` and `SamlProviderList.js`)

2. **Admin API Endpoints**:
   - **`GET /api/admin/saml/providers`**: List all providers
   - **`GET /api/admin/saml/providers/{id}`**: Get specific provider
   - **`POST /api/admin/saml/providers`**: Create new provider
   - **`PUT /api/admin/saml/providers/{id}`**: Update existing provider
   - **`DELETE /api/admin/saml/providers/{id}`**: Delete provider

### Setting Up a New SAML Provider

1. **Gather Information from Identity Provider**:
   - Entity ID (e.g., `https://idp.example.com`)
   - Single Sign-On URL (e.g., `https://idp.example.com/saml2/sso`)
   - X.509 certificate (public key for signature verification)
   - Basically,IdP Metadata->can be through url/xml file or manually filled.

2. **Create Provider in Admin Interface**:
   - Fill in provider details (ID, display name, etc.)
   - Enter IdP entity ID, SSO URL, and certificate
   - Configure role mapping (optional)
   - Set tenant ID (for tenant-specific provider)
   - Enable the provider

3. **Configure the SP details in the Idp**:
   - After setting up the provider in Admin UI
   - The entityId and ACS url will be displayed.
   - Copy those urls and set it up in the Idp.

4. **Test Authentication**:
   - Log out from current session
   - Access login page
   - Select the newly configured SAML provider
   - Authenticate through the identity provider

## Monitoring and Troubleshooting
### Common SAML Issues

1. **Certificate Problems**:
   - Check certificate expiration date
   - Ensure certificate is in correct format (Base64-encoded X.509)
   - Verify certificate is from the correct identity provider

2. **Entity ID or ACS Url Mismatch**:
   - Verify IdP entity ID /ACS Url matches exactly what's configured
   - Check audience restriction in SAML response

3. **YAML File Issues**:
   - Check file permissions and ownership
   - Verify YAML syntax is correct (no indentation errors)
   - Ensure the file is in the expected location

### Checking Provider Status

To verify SAML provider status:

1. **Check Provider List**:
   - Access `/api/admin/saml/providers` to list all providers
   - Verify provider is enabled and correctly configured

2. **Test Provider Metadata**:
   - Access `/saml2/service-provider-metadata/{registrationId}`
   - Verify metadata is correctly generated

3. **Monitor Authentication Attempts**:
   - Check logs for authentication attempts
   - Look for specific error messages related to SAML processing

---