# MyDocNG API Documentation

This document outlines the API endpoints available for the MyDocNG telemedicine platform, covering doctor, patient, consultation, notification, chat, and profile management functionalities.

## Base URL

All endpoints are prefixed with `/api`

## Authentication

Most endpoints require authentication using a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Doctor Endpoints

Base path: `/doctor`

### Authentication

#### Google OAuth2 Integration

```
GET /google/:doctorId
```

Initiates the Google OAuth2 flow for a doctor.

```
GET /google/callback
```

Callback endpoint for Google OAuth2 authentication.

### Doctor Listings

#### Get All Doctors

```
GET /
```

Returns a list of all doctors in the system.

#### Get Top Doctors

```
GET /top
```

Returns a list of top-rated doctors.

#### Get General Practitioners

```
GET /general-practitioners
```

Returns a list of general practitioners.

#### Search Doctors

```
GET /search
```

Query Parameters:
- `query`: Search term
- `specialty`: Filter by specialty
- `location`: Filter by location

Searches for doctors based on provided criteria.

### Doctor Profile

#### Get Doctor Profile

```
GET /profile
```

Returns the authenticated doctor's profile information.

#### Get Doctor Documents

```
GET /documents
```

Returns the authenticated doctor's uploaded documents.

### Appointments

#### Get Doctor Availability

```
GET /:doctorId/availability
```

Returns a doctor's availability schedule.

#### Get All Appointments

```
GET /appointments
```

Returns all appointments for the authenticated doctor.

#### Get Appointment by ID

```
GET /appointments/view/:appointmentId
```

Returns details of a specific appointment.

#### Get Appointment History

```
GET /appointments/history
```

Returns the appointment history for the authenticated doctor.

#### Accept Appointment

```
PATCH /appointments/:id/accept
```

Accepts a pending appointment request.

#### Cancel Appointment

```
PATCH /appointments/:id/cancel
```

Body:
```json
{
  "reason": "Reason for cancellation"
}
```

Cancels an upcoming appointment.

#### Reschedule Appointment

```
PATCH /appointments/:id/reschedule
```

Body:
```json
{
  "newDate": "2023-12-01",
  "newTime": "14:00",
  "reason": "Reason for rescheduling"
}
```

Reschedules an appointment to a new date and time.

#### Get Patients Seen

```
GET /doctor/patients-seen
```

Returns the count and list of patients seen by the doctor.

### Patient Management

#### Get Chat with Patient

```
GET /chat/:patientId
```

Returns the chat history with a specific patient.

#### Send Message to Patient

```
POST /chat/:patientId
```

Body:
```json
{
  "message": "Message content",
  "type": "TEXT" // or "IMAGE", "DOCUMENT", etc.
}
```

Sends a message to a specific patient.

#### Add Medical Notes

```
POST /medical-notes/:appointmentId
```

Body:
```json
{
  "notes": "Medical notes content",
  "diagnosis": "Diagnosis information",
  "prescription": "Prescription details"
}
```

Adds medical notes to a specific appointment.

#### Get Patient History

```
GET /patient-history/:patientId
```

Returns the medical history of a specific patient.

#### Refer Patient

```
POST /referrals/:patientId
```

Body:
```json
{
  "referredToDoctor": "doctorId",
  "reason": "Reason for referral",
  "notes": "Additional notes"
}
```

Refers a patient to another doctor.

### Financial Management

#### Get Balance

```
GET /balance
```

Returns the doctor's current balance.

#### Get Transaction History

```
GET /transaction-history
```

Returns the doctor's transaction history.

#### Request Withdrawal

```
POST /withdraw
```

Body:
```json
{
  "amount": 5000,
  "bankAccountId": "account_id"
}
```

Requests a withdrawal of funds to the doctor's bank account.

#### Add Bank Account

```
POST /payments/account
```

Body:
```json
{
  "accountNumber": "0123456789",
  "accountName": "John Doe",
  "bankName": "First Bank",
  "bankCode": "011"
}
```

Adds a bank account for receiving payments.

#### Get Bank Account

```
GET /payments/account
```

Returns the doctor's bank account information.

## Patient Endpoints

Base path: `/patient`

### User Management

#### Get All Users

```
GET /
```

Returns a list of all users in the system.

### Appointment Management

#### Get Upcoming Consultations

```
GET /appointments/upcoming/:userId
```

Returns upcoming consultations for a specific user.

#### Get Pending Consultations

```
GET /appointments/pending/:userId
```

Returns pending consultations for a specific user.

#### Get Completed Consultations

```
GET /appointments/completed/:userId
```

Returns completed consultations for a specific user.

#### Get Cancelled Consultations

```
GET /appointments/cancelled/:userId
```

Returns cancelled consultations for a specific user.

#### Book GOPD Consultation

```
POST /appointments/gopd
```

Body:
```json
{
  "date": "2023-12-01",
  "time": "14:00",
  "symptoms": "Fever, headache",
  "duration": "3 days"
}
```

Books a General Outpatient Department consultation.

#### Book Consultation

```
POST /appointments
```

Body:
```json
{
  "doctorId": "doctor_id",
  "date": "2023-12-01",
  "time": "14:00",
  "symptoms": "Fever, headache",
  "duration": "3 days"
}
```

Books a consultation with a specific doctor.

#### Cancel Appointment

```
POST /appointments/cancel/:appointmentId
```

Body:
```json
{
  "reason": "Reason for cancellation"
}
```

Cancels an upcoming appointment.

### Doctor Discovery

#### Get General Practitioners

```
GET /doctors/gp
```

Returns a list of general practitioners.

#### Get Specializations

```
GET /doctors/specializations
```

Returns a list of available medical specializations.

#### Get Doctor by ID

```
GET /doctors/:doctorId
```

Returns detailed information about a specific doctor.

#### Get Doctors by Specialty

```
GET /doctors/specialty/:specialty
```

Returns a list of doctors with a specific specialty.

#### Get All Doctors

```
GET /doctors
```

Returns a list of all doctors in the system.

### Reviews

#### Submit Doctor Review

```
POST /reviews
```

Body:
```json
{
  "doctorId": "doctor_id",
  "rating": 5,
  "comment": "Excellent service and care"
}
```

Submits a review for a doctor.

#### Get Doctor Reviews

```
GET /reviews/:doctorId
```

Returns reviews for a specific doctor.

## Consultation Endpoints

Base path: `/consultation`

#### Get Doctor Consultations

```
GET /appointments/doctor/:doctorId
```

Returns consultations for a specific doctor.

#### Get Consultation by ID

```
GET /:id
```

Returns details of a specific consultation.

## Notification Endpoints

Base path: `/notification`

#### Get Notifications

```
GET /notifications
```

Returns notifications for the authenticated user.

#### Mark Notification as Read

```
PATCH /notifications/:id/read
```

Marks a specific notification as read.

#### Mark All Notifications as Read

```
PATCH /notifications/read-all
```

Marks all notifications as read for the authenticated user.

## Chat Endpoints

Base path: `/chat`

#### Send Message

```
POST /chats/send
```

Body:
```json
{
  "receiverId": "user_id",
  "message": "Message content",
  "type": "TEXT" // or "IMAGE", "DOCUMENT", etc.
}
```

Sends a message to another user.

#### Get Messages

```
GET /chats/:userId
```

Returns chat messages between the authenticated user and another user.

#### Send Voice Message

```
POST /chats/voice
```

Form data:
- `voice`: Audio file
- `receiverId`: ID of the message recipient

Sends a voice message to another user.

## Profile Endpoints

Base path: `/profile`

#### Get Profile

```
GET /profile
```

Returns the authenticated user's profile information.

#### Update Profile

```
PUT /profile
```

Body:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+2348012345678",
  "gender": "MALE",
  "dateOfBirth": "1990-01-01",
  "address": "123 Main Street",
  "city": "Lagos",
  "state": "Lagos State",
  "country": "Nigeria"
}
```

Updates the authenticated user's profile information.

#### Change Password

```
POST /change-password
```

Body:
```json
{
  "currentPassword": "currentPassword123",
  "newPassword": "newPassword123"
}
```

Changes the authenticated user's password.

#### Delete Account

```
DELETE /delete-account
```

Deletes the authenticated user's account.

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