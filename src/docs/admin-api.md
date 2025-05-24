# MyDocNG Admin Panel API Documentation

This document outlines the API endpoints available for the MyDocNG Admin Panel, which provides administrators with full control over users, consultations, transactions, disputes, and system configurations.

## Base URL

All endpoints are prefixed with `/api/admin`

## Authentication

All endpoints (except login) require authentication using a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Dashboard

#### Get Dashboard Statistics

```
GET /dashboard
```

Returns statistics for the admin dashboard including:
- User counts (doctors, patients)
- Consultation statistics (active, pending, completed)
- Revenue summary
- Dispute status
- API status

### User Management

#### Get All Patients

```
GET /users
```

Returns a list of all patients in the system.

#### Update Patient Status

```
PUT /users/:userId/status
```

Body:
```json
{
  "isActive": true|false
}
```

Activates or suspends a patient account.

### Doctor Management

#### Get All Doctors

```
GET /doctors
```

Returns a list of all doctors in the system, including their profiles, reviews, and consultation history.

#### Update Doctor Status

```
PUT /doctors/:doctorId/status
```

Body:
```json
{
  "isApproved": true|false
}
```

Approves or suspends a doctor account.

### Consultation Management

#### Get All Consultations

```
GET /consultations
```

Query Parameters:
- `status`: Filter by status (PENDING, CONFIRMED, COMPLETED, CANCELLED, UPCOMING)
- `doctorId`: Filter by doctor
- `patientId`: Filter by patient
- `startDate`: Filter by start date
- `endDate`: Filter by end date

Returns a list of consultations based on the provided filters.

### Dispute Management

#### Get All Disputes

```
GET /disputes
```

Query Parameters:
- `status`: Filter by status (OPEN, RESOLVED)
- `consultationId`: Filter by consultation

Returns a list of disputes based on the provided filters.

#### Resolve Dispute

```
PUT /disputes/:disputeId/resolve
```

Body:
```json
{
  "resolution": "Description of the resolution",
  "refund": true|false
}
```

Resolves a dispute and optionally processes a refund.

### Payment Management

#### Get All Payments

```
GET /payments
```

Query Parameters:
- `status`: Filter by status (PENDING, COMPLETED, FAILED)
- `doctorId`: Filter by doctor
- `patientId`: Filter by patient
- `startDate`: Filter by start date
- `endDate`: Filter by end date

Returns a list of payments based on the provided filters.

#### Get All Withdrawals

```
GET /withdrawals
```

Query Parameters:
- `status`: Filter by status (PENDING, APPROVED, REJECTED)
- `userId`: Filter by user
- `startDate`: Filter by start date
- `endDate`: Filter by end date

Returns a list of withdrawal requests based on the provided filters.

#### Update Withdrawal Status

```
PUT /withdrawals/:withdrawalId/status
```

Body:
```json
{
  "status": "PENDING|APPROVED|REJECTED"
}
```

Updates the status of a withdrawal request.

### System Configuration

#### Update Commission Rate

```
PUT /config/commission
```

Body:
```json
{
  "rate": 10
}
```

Updates the platform's commission rate (percentage).

### API Monitoring

#### Get API Logs

```
GET /api-logs
```

Returns logs of API activities, particularly focusing on Google Meet link generation.

### Authentication

#### Register Admin

```
POST /register
```

Body: (follows doctor signup schema)

Registers a new admin user.

#### Login

```
POST /login
```

Body: (follows doctor login schema)

Authenticate an admin user and receive a JWT token.

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