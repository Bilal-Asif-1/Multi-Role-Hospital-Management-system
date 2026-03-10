# IHIS Database Schema

PostgreSQL database structure – all tables and columns.

---

## 1. users

| Column          | Type      | Nullable | Default     | Description                    |
|-----------------|-----------|----------|-------------|--------------------------------|
| id              | UUID      | NO       | uuid()      | Primary key                    |
| email           | TEXT      | NO       | -           | User email                     |
| password        | TEXT      | NO       | -           | Hashed password                |
| firstName       | TEXT      | NO       | -           | First name                     |
| lastName        | TEXT      | NO       | -           | Last name                      |
| phone           | TEXT      | YES      | -           | Phone number                   |
| dateOfBirth     | TIMESTAMP | YES      | -           | Date of birth                  |
| gender          | TEXT      | YES      | -           | Gender                         |
| cnic            | TEXT      | YES      | -           | CNIC number                    |
| role            | UserRole  | NO       | -           | ADMIN, DOCTOR, NURSE, PATIENT  |
| isActive        | BOOLEAN   | NO       | true        | Account active flag            |
| isApproved      | BOOLEAN   | NO       | false       | Approval status                |
| profileCompleted| BOOLEAN   | NO       | false       | Profile completed flag         |
| createdAt       | TIMESTAMP | NO       | now()       | Creation time                  |
| updatedAt       | TIMESTAMP | NO       | now()       | Last update time               |

**Unique constraints:** (email, role), (phone, role)

---

## 2. doctors

| Column          | Type    | Nullable | Default | Description           |
|-----------------|---------|----------|---------|-----------------------|
| id              | UUID    | NO       | uuid()  | Primary key           |
| userId          | UUID    | NO       | -       | FK → users.id         |
| specialization  | TEXT    | YES      | -       | Medical specialization|
| licenseNumber   | TEXT    | YES      | -       | License number        |
| departmentId    | UUID    | YES      | -       | FK → departments.id   |
| department      | TEXT    | YES      | -       | Department name       |
| bio             | TEXT    | YES      | -       | Biography             |
| cvData          | TEXT    | YES      | -       | Base64 CV             |
| cvFileName      | TEXT    | YES      | -       | CV filename           |
| cvFileType      | TEXT    | YES      | -       | CV file type          |
| licenseImage    | TEXT    | YES      | -       | Base64 license image  |
| appointmentFees | FLOAT   | YES      | 0       | Appointment fee       |
| salary          | FLOAT   | YES      | 0       | Base salary           |
| createdAt       | TIMESTAMP| NO       | now()   | Creation time         |
| updatedAt       | TIMESTAMP| NO       | now()   | Last update time      |

**Unique constraint:** userId

---

## 3. nurses

| Column       | Type     | Nullable | Default | Description      |
|--------------|----------|----------|---------|------------------|
| id           | UUID     | NO       | uuid()  | Primary key      |
| userId       | UUID     | NO       | -       | FK → users.id    |
| departmentId | UUID     | YES      | -       | FK → departments.id |
| department   | TEXT     | YES      | -       | Department name  |
| licenseNumber| TEXT     | YES      | -       | License number   |
| cvData       | TEXT     | YES      | -       | CV data          |
| cvFileName   | TEXT     | YES      | -       | CV filename      |
| cvFileType   | TEXT     | YES      | -       | CV file type     |
| licenseImage | TEXT     | YES      | -       | License image    |
| salary       | FLOAT    | YES      | 0       | Salary           |
| createdAt    | TIMESTAMP| NO       | now()   | Creation time    |
| updatedAt    | TIMESTAMP| NO       | now()   | Last update time |

**Unique constraint:** userId

---

## 4. patients

| Column           | Type       | Nullable | Default   | Description              |
|------------------|------------|----------|-----------|--------------------------|
| id               | UUID       | NO       | uuid()    | Primary key              |
| userId           | UUID       | NO       | -         | FK → users.id            |
| dateOfBirth      | TIMESTAMP  | YES      | -         | Date of birth            |
| gender           | TEXT       | YES      | -         | Gender                   |
| cnic             | TEXT       | YES      | -         | CNIC number              |
| address          | TEXT       | YES      | -         | Address                  |
| emergencyContact | TEXT       | YES      | -         | Emergency contact name   |
| emergencyPhone   | TEXT       | YES      | -         | Emergency phone          |
| bloodGroup       | TEXT       | YES      | -         | Blood group              |
| allergies        | TEXT       | YES      | -         | Allergies                |
| medicalHistory   | TEXT       | YES      | -         | Medical history          |
| currentState     | PatientState| NO      | WAITING   | Patient state            |
| departmentId     | UUID       | YES      | -         | FK → departments.id      |
| createdAt        | TIMESTAMP  | NO       | now()     | Creation time            |
| updatedAt        | TIMESTAMP  | NO       | now()     | Last update time         |

**Unique constraint:** userId

---

## 5. departments

| Column        | Type     | Nullable | Default | Description     |
|---------------|----------|----------|---------|-----------------|
| id            | UUID     | NO       | uuid()  | Primary key     |
| name          | TEXT     | NO       | -       | Department name |
| description   | TEXT     | YES      | -       | Description     |
| headDoctorId  | UUID     | YES      | -       | Head doctor ID  |
| createdAt     | TIMESTAMP| NO       | now()   | Creation time   |
| updatedAt     | TIMESTAMP| NO       | now()   | Last update     |

**Unique constraint:** name

---

## 6. rooms

| Column     | Type      | Nullable | Default   | Description   |
|------------|-----------|----------|-----------|---------------|
| id         | UUID      | NO       | uuid()    | Primary key   |
| roomNumber | TEXT      | NO       | -         | Room number   |
| name       | TEXT      | YES      | -         | Room name     |
| type       | TEXT      | YES      | -         | Room type     |
| floor      | TEXT      | YES      | -         | Floor         |
| departmentId| UUID     | YES      | -         | FK → departments.id |
| status     | RoomStatus| NO       | AVAILABLE | Room status   |
| capacity   | INT       | NO       | 1         | Bed capacity  |
| notes      | TEXT      | YES      | -         | Notes         |
| createdAt  | TIMESTAMP | NO       | now()     | Creation time |
| updatedAt  | TIMESTAMP | NO       | now()     | Last update   |

**Unique constraint:** roomNumber

---

## 7. beds

| Column       | Type     | Nullable | Default   | Description   |
|--------------|----------|----------|-----------|---------------|
| id           | UUID     | NO       | uuid()    | Primary key   |
| roomId       | UUID     | NO       | -         | FK → rooms.id |
| label        | TEXT     | NO       | -         | Bed label     |
| status       | BedStatus| NO       | AVAILABLE | Bed status    |
| lastCleanedAt| TIMESTAMP| YES      | -         | Last cleaned  |
| createdAt    | TIMESTAMP| NO       | now()     | Creation time |
| updatedAt    | TIMESTAMP| NO       | now()     | Last update   |

**Unique constraint:** (roomId, label)

---

## 8. bed_assignments

| Column    | Type              | Nullable | Default | Description    |
|-----------|-------------------|----------|---------|----------------|
| id        | UUID              | NO       | uuid()  | Primary key    |
| bedId     | UUID              | NO       | -       | FK → beds.id   |
| patientId | UUID              | NO       | -       | FK → patients.id |
| doctorId  | UUID              | YES      | -       | FK → doctors.id |
| nurseId   | UUID              | YES      | -       | FK → nurses.id |
| assignedAt| TIMESTAMP         | NO       | now()   | Assigned at    |
| releasedAt| TIMESTAMP         | YES      | -       | Released at    |
| status    | BedAssignmentStatus| NO      | ACTIVE  | Status         |
| notes     | TEXT              | YES      | -       | Notes          |
| createdAt | TIMESTAMP         | NO       | now()   | Creation time  |
| updatedAt | TIMESTAMP         | NO       | now()   | Last update    |

---

## 9. room_housekeeping_logs

| Column     | Type     | Nullable | Default | Description   |
|------------|----------|----------|---------|---------------|
| id         | UUID     | NO       | uuid()  | Primary key   |
| roomId     | UUID     | NO       | -       | FK → rooms.id |
| status     | TEXT     | NO       | -       | Status        |
| notes      | TEXT     | YES      | -       | Notes         |
| completedAt| TIMESTAMP| YES      | -       | Completed at  |
| createdAt  | TIMESTAMP| NO       | now()   | Creation time |

---

## 10. doctor_shifts

| Column   | Type     | Nullable | Default | Description   |
|----------|----------|----------|---------|---------------|
| id       | UUID     | NO       | uuid()  | Primary key   |
| doctorId | UUID     | NO       | -       | FK → doctors.id |
| dayOfWeek| INT      | NO       | -       | 0=Sun, 6=Sat  |
| startTime| TEXT     | NO       | -       | Start time    |
| endTime  | TEXT     | NO       | -       | End time      |
| status   | TEXT     | NO       | ACTIVE  | Status        |
| location | TEXT     | YES      | -       | Location      |
| createdAt| TIMESTAMP| NO       | now()   | Creation time |
| updatedAt| TIMESTAMP| NO       | now()   | Last update   |

---

## 11. nurse_shifts

| Column   | Type     | Nullable | Default | Description   |
|----------|----------|----------|---------|---------------|
| id       | UUID     | NO       | uuid()  | Primary key   |
| nurseId  | UUID     | NO       | -       | FK → nurses.id |
| dayOfWeek| INT      | NO       | -       | 0=Sun, 6=Sat  |
| startTime| TEXT     | NO       | -       | Start time    |
| endTime  | TEXT     | NO       | -       | End time      |
| ward     | TEXT     | YES      | -       | Ward          |
| status   | TEXT     | NO       | ACTIVE  | Status        |
| createdAt| TIMESTAMP| NO       | now()   | Creation time |
| updatedAt| TIMESTAMP| NO       | now()   | Last update   |

---

## 12. patient_state_logs

| Column    | Type        | Nullable | Default | Description    |
|-----------|-------------|----------|---------|----------------|
| id        | UUID        | NO       | uuid()  | Primary key    |
| patientId | UUID        | NO       | -       | FK → patients.id |
| fromState | PatientState| YES      | -       | Previous state |
| toState   | PatientState| NO       | -       | New state      |
| context   | TEXT        | YES      | -       | Context        |
| createdAt | TIMESTAMP   | NO       | now()   | Creation time  |

---

## 13. appointments

| Column          | Type              | Nullable | Default   | Description    |
|-----------------|-------------------|----------|-----------|----------------|
| id              | UUID              | NO       | uuid()    | Primary key    |
| patientId       | UUID              | NO       | -         | FK → users.id  |
| doctorId        | UUID              | NO       | -         | FK → users.id  |
| appointmentDate | TIMESTAMP         | NO       | -         | Appointment date |
| appointmentTime | TEXT              | NO       | -         | Time           |
| status          | AppointmentStatus | NO       | SCHEDULED | Status         |
| reason          | TEXT              | YES      | -         | Reason         |
| notes           | TEXT              | YES      | -         | Notes          |
| createdAt       | TIMESTAMP         | NO       | now()     | Creation time  |
| updatedAt       | TIMESTAMP         | NO       | now()     | Last update    |

---

## 14. doctor_availability

| Column      | Type     | Nullable | Default | Description   |
|-------------|----------|----------|---------|---------------|
| id          | UUID     | NO       | uuid()  | Primary key   |
| doctorId    | UUID     | NO       | -       | FK → doctors.id |
| dayOfWeek   | INT      | NO       | -       | 0=Sun, 6=Sat  |
| startTime   | TEXT     | NO       | -       | Start time    |
| endTime     | TEXT     | NO       | -       | End time      |
| isAvailable | BOOLEAN  | NO       | true    | Available     |
| createdAt   | TIMESTAMP| NO       | now()   | Creation time |
| updatedAt   | TIMESTAMP| NO       | now()   | Last update   |

---

## 15. visit_notes

| Column         | Type     | Nullable | Default | Description   |
|----------------|----------|----------|---------|---------------|
| id             | UUID     | NO       | uuid()  | Primary key   |
| patientId      | UUID     | NO       | -       | FK → patients.id |
| doctorId       | UUID     | NO       | -       | FK → doctors.id |
| appointmentId  | UUID     | YES      | -       | Appointment   |
| visitDate      | TIMESTAMP| NO       | now()   | Visit date    |
| chiefComplaint | TEXT     | YES      | -       | Chief complaint |
| diagnosis      | TEXT     | YES      | -       | Diagnosis     |
| treatmentPlan  | TEXT     | YES      | -       | Treatment plan|
| notes          | TEXT     | YES      | -       | Notes         |
| createdAt      | TIMESTAMP| NO       | now()   | Creation time |
| updatedAt      | TIMESTAMP| NO       | now()   | Last update   |

---

## 16. attachments

| Column      | Type     | Nullable | Default | Description   |
|-------------|----------|----------|---------|---------------|
| id          | UUID     | NO       | uuid()  | Primary key   |
| visitNoteId | UUID     | YES      | -       | FK → visit_notes.id |
| labRecordId | UUID     | YES      | -       | FK → lab_records.id |
| fileName    | TEXT     | NO       | -       | File name     |
| filePath    | TEXT     | NO       | -       | File path     |
| fileType    | TEXT     | YES      | -       | File type     |
| fileSize    | INT      | YES      | -       | File size     |
| uploadedAt  | TIMESTAMP| NO       | now()   | Upload time   |

---

## 17. lab_records

| Column    | Type     | Nullable | Default | Description   |
|-----------|----------|----------|---------|---------------|
| id        | UUID     | NO       | uuid()  | Primary key   |
| patientId | UUID     | NO       | -       | FK → patients.id |
| testName  | TEXT     | NO       | -       | Test name     |
| testDate  | TIMESTAMP| NO       | now()   | Test date     |
| results   | TEXT     | YES      | -       | Results       |
| status    | TEXT     | YES      | -       | Status        |
| orderedBy | TEXT     | YES      | -       | Ordered by    |
| notes     | TEXT     | YES      | -       | Notes         |
| createdAt | TIMESTAMP| NO       | now()   | Creation time |
| updatedAt | TIMESTAMP| NO       | now()   | Last update   |

---

## 18. prescriptions

| Column        | Type     | Nullable | Default | Description   |
|---------------|----------|----------|---------|---------------|
| id            | UUID     | NO       | uuid()  | Primary key   |
| patientId     | UUID     | NO       | -       | FK → patients.id |
| doctorId      | UUID     | NO       | -       | FK → users.id |
| appointmentId | UUID     | YES      | -       | Appointment   |
| medications   | JSON     | NO       | -       | Medications   |
| instructions  | TEXT     | YES      | -       | Instructions  |
| prescribedDate| TIMESTAMP| NO       | now()   | Prescribed at |
| validUntil    | TIMESTAMP| YES      | -       | Valid until   |
| createdAt     | TIMESTAMP| NO       | now()   | Creation time |
| updatedAt     | TIMESTAMP| NO       | now()   | Last update   |

---

## 19. invoices

| Column        | Type        | Nullable | Default | Description   |
|---------------|-------------|----------|---------|---------------|
| id            | UUID        | NO       | uuid()  | Primary key   |
| patientId     | UUID        | NO       | -       | FK → patients.id |
| invoiceNumber | TEXT        | NO       | -       | Invoice number|
| invoiceDate   | TIMESTAMP   | NO       | now()   | Invoice date  |
| dueDate       | TIMESTAMP   | YES      | -       | Due date      |
| status        | InvoiceStatus| NO      | PENDING | Status        |
| items         | JSON        | NO       | -       | Line items    |
| subtotal      | DECIMAL(10,2)| NO      | -       | Subtotal      |
| tax           | DECIMAL(10,2)| NO      | 0       | Tax           |
| discount      | DECIMAL(10,2)| NO      | 0       | Discount      |
| total         | DECIMAL(10,2)| NO      | -       | Total         |
| notes         | TEXT        | YES      | -       | Notes         |
| paidAt        | TIMESTAMP   | YES      | -       | Paid at       |
| createdAt     | TIMESTAMP   | NO       | now()   | Creation time |
| updatedAt     | TIMESTAMP   | NO       | now()   | Last update   |

**Unique constraint:** invoiceNumber

---

## 20. audit_logs

| Column            | Type     | Nullable | Default | Description   |
|-------------------|----------|----------|---------|---------------|
| id                | UUID     | NO       | uuid()  | Primary key   |
| userId            | UUID     | YES      | -       | FK → users.id |
| userEmail         | TEXT     | YES      | -       | User email    |
| action            | TEXT     | NO       | -       | Action        |
| entityType        | TEXT     | NO       | -       | Entity type   |
| entityId          | TEXT     | YES      | -       | Entity ID     |
| relatedEntityType | TEXT     | YES      | -       | Related type  |
| relatedEntityId   | TEXT     | YES      | -       | Related ID    |
| description       | TEXT     | YES      | -       | Description   |
| ipAddress         | TEXT     | YES      | -       | IP address    |
| userAgent         | TEXT     | YES      | -       | User agent    |
| changes           | JSON     | YES      | -       | Changes       |
| metadata          | JSON     | YES      | -       | Metadata      |
| createdAt         | TIMESTAMP| NO       | now()   | Creation time |

---

## 21. vitals

| Column           | Type        | Nullable | Default | Description   |
|------------------|-------------|----------|---------|---------------|
| id               | UUID        | NO       | uuid()  | Primary key   |
| patientId        | UUID        | NO       | -       | FK → patients.id |
| recordedBy       | TEXT        | NO       | -       | Recorded by   |
| recordedAt       | TIMESTAMP   | NO       | now()   | Recorded at   |
| bloodPressure    | TEXT        | YES      | -       | BP            |
| heartRate        | INT         | YES      | -       | Heart rate    |
| temperature      | DECIMAL(4,1)| YES      | -       | Temp          |
| oxygenSaturation | DECIMAL(5,2)| YES      | -       | SpO2          |
| weight           | DECIMAL(5,2)| YES      | -       | Weight (kg)   |
| height           | DECIMAL(5,2)| YES      | -       | Height (m)    |
| bmi              | DECIMAL(4,1)| YES      | -       | BMI           |
| notes            | TEXT        | YES      | -       | Notes         |
| createdAt        | TIMESTAMP   | NO       | now()   | Creation time |
| updatedAt        | TIMESTAMP   | NO       | now()   | Last update   |

---

## 22. nursing_notes

| Column        | Type     | Nullable | Default | Description   |
|---------------|----------|----------|---------|---------------|
| id            | UUID     | NO       | uuid()  | Primary key   |
| patientId     | UUID     | NO       | -       | FK → patients.id |
| nurseId       | UUID     | NO       | -       | FK → users.id |
| noteDate      | TIMESTAMP| NO       | now()   | Note date     |
| noteType      | TEXT     | YES      | -       | Note type     |
| content       | TEXT     | NO       | -       | Content       |
| observations  | TEXT     | YES      | -       | Observations  |
| interventions | TEXT     | YES      | -       | Interventions |
| createdAt     | TIMESTAMP| NO       | now()   | Creation time |
| updatedAt     | TIMESTAMP| NO       | now()   | Last update   |

---

## 23. tasks

| Column            | Type     | Nullable | Default | Description   |
|-------------------|----------|----------|---------|---------------|
| id                | UUID     | NO       | uuid()  | Primary key   |
| title             | TEXT     | NO       | -       | Title         |
| description       | TEXT     | YES      | -       | Description   |
| assignedTo        | UUID     | NO       | -       | FK → users.id |
| assignedBy        | UUID     | NO       | -       | FK → users.id |
| priority          | TEXT     | NO       | MEDIUM  | Priority      |
| status            | TEXT     | NO       | PENDING | Status        |
| dueDate           | TIMESTAMP| YES      | -       | Due date      |
| completedAt       | TIMESTAMP| YES      | -       | Completed at  |
| patientId         | UUID     | YES      | -       | FK → patients.id |
| relatedEntityType | TEXT     | YES      | -       | Related type  |
| relatedEntityId   | TEXT     | YES      | -       | Related ID    |
| createdAt         | TIMESTAMP| NO       | now()   | Creation time |
| updatedAt         | TIMESTAMP| NO       | now()   | Last update   |

---

## 24. notifications

| Column            | Type     | Nullable | Default | Description   |
|-------------------|----------|----------|---------|---------------|
| id                | UUID     | NO       | uuid()  | Primary key   |
| userId            | UUID     | NO       | -       | FK → users.id |
| title             | TEXT     | NO       | -       | Title         |
| message           | TEXT     | NO       | -       | Message       |
| type              | TEXT     | NO       | -       | Type          |
| isRead            | BOOLEAN  | NO       | false   | Read status   |
| readAt            | TIMESTAMP| YES      | -       | Read at       |
| actionUrl         | TEXT     | YES      | -       | Action URL    |
| relatedEntityType | TEXT     | YES      | -       | Related type  |
| relatedEntityId   | TEXT     | YES      | -       | Related ID    |
| createdAt         | TIMESTAMP| NO       | now()   | Creation time |

---

## 25. patient_queue

| Column        | Type     | Nullable | Default | Description   |
|---------------|----------|----------|---------|---------------|
| id            | UUID     | NO       | uuid()  | Primary key   |
| patientId     | UUID     | NO       | -       | FK → patients.id |
| appointmentId | UUID     | YES      | -       | Appointment   |
| checkedInAt   | TIMESTAMP| NO       | now()   | Check-in time |
| status        | TEXT     | NO       | WAITING | Status        |
| priority      | TEXT     | NO       | NORMAL  | Priority      |
| doctorId      | UUID     | YES      | -       | FK → users.id |
| notes         | TEXT     | YES      | -       | Notes         |
| createdAt     | TIMESTAMP| NO       | now()   | Creation time |
| updatedAt     | TIMESTAMP| NO       | now()   | Last update   |

---

## 26. salary_withdrawals

| Column          | Type            | Nullable | Default | Description   |
|-----------------|-----------------|----------|---------|---------------|
| id              | UUID            | NO       | uuid()  | Primary key   |
| employeeId      | TEXT            | NO       | -       | Doctor/Nurse ID |
| employeeType    | TEXT            | NO       | -       | DOCTOR/NURSE  |
| amount          | FLOAT           | NO       | -       | Amount        |
| status          | WithdrawalStatus| NO      | PENDING | Status        |
| requestedAt     | TIMESTAMP       | NO       | now()   | Requested at  |
| approvedAt      | TIMESTAMP       | YES      | -       | Approved at   |
| completedAt     | TIMESTAMP       | YES      | -       | Completed at  |
| rejectedAt      | TIMESTAMP       | YES      | -       | Rejected at   |
| rejectionReason | TEXT            | YES      | -       | Rejection reason |
| notes           | TEXT            | YES      | -       | Notes         |
| createdAt       | TIMESTAMP       | NO       | now()   | Creation time |
| updatedAt       | TIMESTAMP       | NO       | now()   | Last update   |

---

## 27. hospital_account

| Column       | Type     | Nullable | Default | Description   |
|--------------|----------|----------|---------|---------------|
| id           | UUID     | NO       | uuid()  | Primary key   |
| balance      | FLOAT    | NO       | 0       | Balance       |
| totalRevenue | FLOAT    | NO       | 0       | Total revenue |
| totalExpenses| FLOAT    | NO       | 0       | Total expenses|
| lastUpdated  | TIMESTAMP| NO       | now()   | Last updated  |

---

## 28. salaries

| Column               | Type     | Nullable | Default | Description   |
|----------------------|----------|----------|---------|---------------|
| id                   | UUID     | NO       | uuid()  | Primary key   |
| employeeId           | TEXT     | NO       | -       | Doctor/Nurse ID |
| employeeType         | TEXT     | NO       | -       | DOCTOR/NURSE  |
| periodStart          | TIMESTAMP| NO       | -       | Period start  |
| periodEnd            | TIMESTAMP| NO       | -       | Period end    |
| baseSalary           | FLOAT    | NO       | -       | Base salary   |
| appointmentEarnings  | FLOAT    | NO       | 0       | Appointment earnings |
| appointmentShares    | JSON     | YES      | -       | Appointment shares |
| totalSalary          | FLOAT    | NO       | -       | Total salary  |
| isDeleted            | BOOLEAN  | NO       | false   | Soft delete   |
| deletedAt            | TIMESTAMP| YES      | -       | Deleted at    |
| createdAt            | TIMESTAMP| NO       | now()   | Creation time |
| updatedAt            | TIMESTAMP| NO       | now()   | Last update   |

---

## Enums

| Enum                | Values                                                    |
|---------------------|-----------------------------------------------------------|
| UserRole            | ADMIN, DOCTOR, NURSE, PATIENT                             |
| AppointmentStatus   | SCHEDULED, CONFIRMED, COMPLETED, CANCELLED, RESCHEDULED   |
| InvoiceStatus       | PENDING, PAID, OVERDUE, CANCELLED                         |
| RoomStatus          | AVAILABLE, OCCUPIED, BOOKED, MAINTENANCE, CLEANING        |
| BedStatus           | AVAILABLE, OCCUPIED, RESERVED, CLEANING, MAINTENANCE      |
| BedAssignmentStatus | ACTIVE, COMPLETED, CANCELLED                              |
| PatientState        | WAITING, IN_APPOINTMENT, IN_OPERATION, IN_WARD, ADMITTED, DISCHARGED |
| WithdrawalStatus    | PENDING, APPROVED, REJECTED, COMPLETED                    |
