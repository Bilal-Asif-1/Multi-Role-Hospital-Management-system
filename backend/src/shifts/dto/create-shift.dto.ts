export class CreateDoctorShiftDto {
  doctorId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  status?: string
  location?: string
}

export class CreateNurseShiftDto {
  nurseId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  ward?: string
  status?: string
}

export class UpdateShiftStatusDto {
  status: string
}

