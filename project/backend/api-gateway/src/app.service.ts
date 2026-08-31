/**
 * AppService — small application-level service.
 *
 * - Exposes utility methods used by the `AppController` for simple responses.
 */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { HealthServices } from './dto/health-check.dto';
import { ContactSalesDto } from './dto/contact-sales.dto';
import { Resend } from 'resend';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { ProxyService } from './proxy/proxy.service';

@Injectable()
export class AppService {
  private readonly resend: Resend;
  private readonly salesEmail: string | undefined;

  constructor(
    private readonly config: ConfigService,
    private readonly proxy: ProxyService,
  ) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
    this.salesEmail = this.config.get<string>('OUR_EMAIL');
  }

  async checkMicroServicesHealth(): Promise<HealthServices> {
    const healthServices: HealthServices = {
      accountsService: await this.checkServiceHealth(this.proxy.accountsClient),
      mailingService: await this.checkServiceHealth(this.proxy.mailingClient),
      xpService: await this.checkServiceHealth(this.proxy.xpClient),
      reportService: await this.checkServiceHealth(this.proxy.reportClient),
      educationService: await this.checkServiceHealth(
        this.proxy.educationClient,
      ),
      analyticsService: await this.checkServiceHealth(
        this.proxy.analyticsClient,
      ),
      llmService: await this.checkServiceHealth(this.proxy.llmClient),
      companyService: await this.checkServiceHealth(this.proxy.companyClient),
    };

    return healthServices;
  }

  private async checkServiceHealth(client: ClientProxy): Promise<string> {
    try {
      return await firstValueFrom(client.send('health.check', {}));
    } catch {
      return 'unavailable';
    }
  }

  async contactSales(dto: ContactSalesDto): Promise<{ message: string }> {
    try {
      await this.resend.emails.send({
        from: 'noreply@capstone-five-guys.dns.net.za',
        to: dto.workEmail,
        replyTo: this.salesEmail,
        subject: `Bringing PhishShield to ${dto.companyName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <h2>Thanks for your interest in PhishShield</h2>
            <p>Hi there,</p>
            <p>Thanks for reaching out on behalf of <strong>${dto.companyName}</strong>. PhishShield helps
            organisations run realistic, AI-generated phishing simulations, track detection rates in
            real time, and turn every click into a teachable moment for employees.</p>
            <p>We can stand up a dedicated PhishShield deployment for your organisation, with your own
            users, departments, and admins.</p>
            <p><strong>Next steps:</strong> a sales representative will be contacting you within the
            next business day or two to walk through your requirements and get you onboarded.</p>
            <p>Talk soon,<br/>The PhishShield Team</p>
          </div>`,
      });

      if (this.salesEmail) {
        await this.resend.emails.send({
          from: 'noreply@capstone-five-guys.dns.net.za',
          to: this.salesEmail,
          replyTo: dto.workEmail,
          subject: `New PhishShield lead: ${dto.companyName}`,
          html: `
            <p><strong>Company:</strong> ${dto.companyName}</p>
            <p><strong>Work email:</strong> ${dto.workEmail}</p>
            <p><strong>Message:</strong> ${dto.message ?? '—'}</p>`,
        });
      }
    } catch (err: unknown) {
      console.error('Failed to send contact-sales email', err);
      throw new InternalServerErrorException(
        'Could not send email, please try again',
      );
    }
    return { message: 'Thanks! Check your inbox for more information.' };
  }
}
