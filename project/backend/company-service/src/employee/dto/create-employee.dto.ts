export class CreateEmployeeDto {
    employeeId!: string;

    email!: string;

    firstName?: string;

    lastName?: string;

    department?: string;

    jobTitle?: string;

    managerId?: string;

    employeeStatus?: string;

    externalId?: string;

    dateImported!: Date;
}
