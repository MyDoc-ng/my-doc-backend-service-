# MyDocNG Authentication API Documentation

This document outlines the API endpoints available for authentication in the MyDocNG telemedicine platform, including user registration, login, password management, and document verification.

## Base URL

All endpoints are prefixed with `/api/auth`

## Authentication

Most endpoints do not require authentication, as they are used for the authentication process itself. Endpoints that do require authentication will use a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Registration and Login

#### Register User

```
POST /register
```

Body:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+2348012345678",
  "role": "PATIENT" // or "DOCTOR"
}
```

Registers a new user (patient or doctor) in the system.

#### Login

```
POST /login
```

Body:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

Authenticates a user and returns a JWT token.

#### Google Authentication

```
POST /google-login
```

Body:
```json
{
  "token": "google_id_token"
}
```

Authenticates a user using Google OAuth credentials.

### Profile Management

#### Submit Biodata

```
PUT /submit-biodata
```

Body:
```json
{
  "gender": "MALE",
  "dateOfBirth": "1990-01-01",
  "address": "123 Main Street",
  "city": "Lagos",
  "state": "Lagos State",
  "country": "Nigeria"
}
```

Updates a user's biographical data.

#### Upload Profile Photo

```
PUT /upload-photo
```

Form data:
- `photo`: Image file (JPEG, PNG)

Uploads a user's profile photo.

### Doctor-Specific Endpoints

#### Upload Documents

```
PUT /upload-documents
```

Form data:
- `medicalLicense`: PDF file of medical license
- `identificationDocument`: PDF or image file of ID
- `certifications`: PDF files of certifications (optional)

Uploads required documents for doctor verification.

#### Update Compliance Information

```
PUT /compliance-check
```

Body:
```json
{
  "licenseNumber": "MED12345",
  "licenseExpiryDate": "2025-12-31",
  "specialization": "Cardiology",
  "yearsOfExperience": 5,
  "hospitalAffiliation": "Lagos University Teaching Hospital"
}
```

Updates a doctor's compliance information for verification.

### Email Verification

#### Verify Email

```
POST /verify-email
```

Body:
```json
{
  "token": "verification_token"
}
```

Verifies a user's email address using the token sent to their email.

### Token Management

#### Refresh Token

```
POST /refresh-token
```

Body:
```json
{
  "refreshToken": "refresh_token_here"
}
```

Generates a new access token using a refresh token.

#### Logout

```
POST /logout
```

Invalidates the current user's tokens. Requires authentication.

### Password Management

#### Request Password Reset

```
POST /request-password-reset
```

Body:
```json
{
  "email": "user@example.com"
}
```

Sends a password reset link to the user's email.

#### Reset Password

```
POST /reset-password
```

Body:
```json
{
  "token": "reset_token",
  "newPassword": "newSecurePassword123"
}
```

Resets a user's password using the token sent to their email.

## Response Format

All API responses follow a standard format:

### Success Response

```json
{
  "success": true,
  "message": "Operation successful message",
  "data": { ... },
  "status": 200
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "error": "Error type",
  "status": 400
}
```

## Error Codes

- 400: Bad Request - Invalid input data
- 401: Unauthorized - Authentication required
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Resource not found
- 500: Internal Server Error - Server-side error