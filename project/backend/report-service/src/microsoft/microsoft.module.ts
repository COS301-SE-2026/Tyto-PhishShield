import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MicrosoftService } from './microsoft.service';

@Module({
    imports: [HttpModule],
    providers: [MicrosoftService],
    exports: [MicrosoftService],
})
export class MicrosoftModule {}