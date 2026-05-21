import { IsString, IsDateString, IsIn } from 'class-validator';

export class CreateReportDto {
  @IsString()
  subject!: string;

  @IsString()
  from!: string;

  @IsString()
  senderName!: string;

  @IsString()
  itemId!: string;

  @IsString()
  internetMessageId!: string;

  @IsDateString()
  dateTimeCreated!: string;

  @IsDateString()
  dateReported!: string;

  @IsString()
  body!: string;

  @IsIn(['outlook-addin'])
  source!: 'outlook-addin';

  @IsString()
  reporterEmail!: string;
}
