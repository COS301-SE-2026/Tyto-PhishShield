import {IsDateString, IsOptional} from 'class-validator';

export class DateRangeDto {
    @IsDateString()
    @IsOptional()
    from?: string;

    @IsDateString()
    @IsOptional()
    to?: string;
}