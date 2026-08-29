import { ImportType } from "../types/import.types";


export class CreateImportDto {
    authIdImportedBy!: string;
    fileName!: string;
    fileType!: string;
    fileSize!: number;
    importType!: ImportType;
    mapping?: Record<string, string> | null;
    file!: File;
}
