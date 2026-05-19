## **Mailing Technologies (Resend and Mailu)**

## Introduction

This document outlines the email delivery technology/infrastructure selected for the simulated phishing attacks. It explains technical challenges and possible solutions for each one.

Our phishing simulations will be structured very similar to real phishing attacks, making us vulnerable to malicious mail flagging. This is especially true since we are sending emails in bulk that includes links made to look suspicious. This means the very mechanism used on the internet to protect people from malicious mail, hinders our platforms efficiency and functionality since being able to send emails is a fundamental part of our platform.

If emails are not able to reach the recipient's inbox, then the simulations will produce no data and we will be unable to provide educational feedback to the recipient. Therefore, it is crucial that our emails do not get blocked.

We have evaluated and selected **Resend**, a cloud email delivery service, since it is designed to handle most of these challenges. We have also chosen **Mailu** as a self-hosted fallback.

In this document we first discuss the details of the problems followed by their possible solutions. We then list all necessary details about both Resend and Mailu. Finally, we will finish off with our plans moving forward.

**Note: There are short summaries after each section.**

---
## Problem: Cold IP

Major providers like Microsoft and Google use a complex trust score system for every sending IP address. This system assigns a score for every IP over time, using strict metrics like: sending volume patterns, bounce rates, complaint rates, and spam trap hits. This score represents the "trust" they have in the mail sent by the IP address.

Our current server has a static IP address and zero mailing history. In industry this is known as "cold" or "neutral" reputation. When we suddenly start transmitting bulk emails while having a cold IP, it mimics the exact behavior of a spam operation. This can lead to providers like Microsoft or Google not trusting our mail and increase the chances of our emails being flagged and blocked as malicious mail.

We are therefore highly vulnerable to being placed on a blacklist by Microsoft, Google or any public blocklist operators. Being blacklisted is a severe problem since it will block all future emails originating from our IP, causing our entire platform to become non-functional.

## Solution: Cold IP

- **Cloud Email API:**
  By using a cloud email API we allow our outgoing emails to have the vendor's reputation score rather than our own, since the email is routed through their servers. Cloud API vendors have high reputation scores at major providers like Microsoft or Google since they have their own security checks on any outgoing emails. This results in out emails having a "warm" IP score. Cloud email API's usually also make use of shared IP pools, which distribute the sending load across multiple pre-warmed IPs.

## Problem: Anti-Abuse AI

Modern email providers and cloud API vendors make use of aggressive AI protection to filter and flag malicious mail. These machine-learning classifiers are trained on a countless amount of spam and phishing samples meaning they are efficient in recognizing suspicions sending behavior, link reputation, and  metadata.

This means that there is a high possibility of our mail being flagged or blocked as malicious mail. This could lead to our account being blacklisted. Being blacklisted is a severe problem since it will block all future emails originating from our account registered, causing our entire platform to become non-functional.

## Solution: Anti-Abuse AI

- **Provider Whitelisting (Best Solution):**
  We communicate with the providers of the cloud routing API to explain the academic and security-focused nature of the project, with the hope of being adding us to a white-list skipping the aggressive AI protection system.
- **Custom Headers:**
  We inject custom headers into the outgoing mail, such as `X-Phishing-Simulation: true`. This is to serve as a critical, standardized signal for enterprise environments. This is with the hope that the AI protection system will not flag the email since its marked as a simulation.
- **Trustworthy Links:**
  We will avoid using URL shorteners and only use URL's that point directly back to our secure, established domain. This is because the AI classifiers heavily penalize un-trustworthy links. A clean, transparent domain reputation will greatly decrease our chances of being flagged than if we used randomized links.

## Problem: Rate Limiting

Modern email providers impose strict rate limits on incoming or outgoing emails per user. This protects them against sending or receiving spam bursts. This is especially true if the incoming emails are from self-hosting servers.

When executing a large-scale phishing simulation, our mail might get blocked to some extent or our connection might completely be blocked if the quantity of emails exceed the rate limit. This can lead to incomplete or inaccurate data.

## Solution: Rate Limiting

- **Cloud Email APIs Selection:**
  By using a cloud email API we are governed by their rules and regulations which include the rate limits they use, rather that Microsoft's strict inbound restrictions. Therefore we must choose a cloud email API with a rate limit high enough for our platform to work as intended.


>[!Summary]
>
>**Cold IP:**
>**Problem:**
>Our static IP has a low reputation score. This increases the chances of being blacklisted.
>**Solution:**
>Use a cloud email API, since they have a shared pool of IP's with high reputation scores.
> ---
>**Anti-Abuse AI:**
>**Problem:**
>Email providers and cloud API vendors have aggressive AI protection that might block or blacklist us.
>**Solution:**
>- Communicate with the vendor.
>- Use custom header injections.
>- Use trustworthy links.
>---
>**Rate Limiting:**
>**Problem:**
>Email providers impose a strict rate limits on incoming or outgoing emails.
>**Solution:**
>Use a cloud email API with a rate limit that's acceptable for us

---
## Webhook:

**What is webhook?**
A webhook is a method for one application to provide real-time information to another application, in the form of an automated HTTP POST request carrying a JSON payload that that describes exactly what occurred and when. Without one, our platform would have to repeatedly request Resend for a status update (also known as polling), which is very resource intensive and slow.

**What events does it track?**
Resend's webhook system fires on specific, named events. The ones most relevant to our platform are:

- `email.delivered`: the email successfully reached the recipient's mail server
- `email.opened`: the recipient opened the email, detected via an embedded tracking pixel
- `email.clicked`: the recipient clicked a link inside the simulation email
- `email.bounced`: the email could not be delivered, for example due to an invalid address
- `email.complained`: the recipient marked the email as spam

**How does our platform use it?**
We will use it track the interaction with our simulated attack for more accurate data to use in our reward system and analysis page. We will also use this data to provide the user with educational material that fits their mistake, if they were to fall victim to the simulated attack. We will also use it to ensure that the moment between the user clicking a malicious link and receiving guidance is as short as possible.

**Is it secure?**
Every webhook request sent by Resend is cryptographically signed using a shared secret key. Our server verifies this signature before processing any payload, ensuring that no external party can send forged event data to our endpoint. This keeps the integrity of our campaign data intact.

>[!Summary]
>
>We will use Resend's built-in webhook to track users interactions with our simulated phishing emails, to get real-time feedback.

---
## What We Chose:

After carefully evaluating our options and the challenges we outlined above, we decided to use Resend as the primary cloud email delivery service for our platform. Should Resend prove unsuitable, we decided to reserve Mailu as the self-hosting fallback solution.

>[!Summary]
>
>**Email Delivery Service:**
>- Primary: Resend
>- Secondary: Mailu

---
## Why Resend?

- **Shared, Pre-warmed IP Pool:**
  Meaning that rather than sending emails from our server's cold, untrustworthy IP address, all our outgoing emails will now be routed through Resend's infrastructure. This will greatly reduce the chances of being blacklisted by providers like Microsoft.
- **Built-in Webhook System:**
  This is how our platform will be tracking user interactions, with our emails, in real time. This way it is not necessary for us to build or maintain a custom tracking layer from scratch. This will save us developmental effort and reduce risk of receiving unreliable data.
- **Batch Email API:**
  By utilizing Resend's Batch Email API, our platform can dispatch up to 100 emails within a single API call. This way we are able to avoid throttling typically imposed on self-hosting servers. As a result, we can execute large-scale, simultaneous simulated phishing attacks without the risk of emails being deferred or blocked due to inbound rate limits.
- **Free Plan:**
  Resend has a generous free tier that provides 3000 emails per month and no "Send via..." watermark. This helps keep the simulated emails looking authentic and allows us to send our emails with no cost.
- **Zero Infrastructure Overhead:**
  Because Resend operates completely in the cloud, it will offload tasks such as SMTP routing and email queueing from our local server. This allows us to dedicate our existing hardware and network bandwidth exclusively to our core features. This will reduce the chances of us needing to invest into additional hardware and will also optimize the program's overall responsiveness.

>[!Summary]
>
>- Resend solves almost all problems we mentioned above
>- Resend has a generous free plan
>- Resend operates completely in the cloud

---
## Anti-abuse problem with Resend:

An obstacle we may encounter under Resend is its aggressive AI filtering system, designed to prevent its platform from being used to send malicious emails. Since our emails simulate real phishing attacks, they have a large possibility of being flagged and blocked by this AI system.

**We will address this through three approaches:**
- Firstly by contacting Resend's support team directly to explain the academic and educational nature of the project and request to be whitelisted to prevent being flagged.
- Secondly by using trustworthy links, that do not use any URL shorteners, we hope to reduce the chances of being flagged and blocked by the AI filtering System. This is because the AI system heavily penalizes URL's that seem suspicious, and by doing this we reduce the suspicion.
- Thirdly by injecting custom headers like `X-Phishing-Simulation: Tyto-PhishShield-Training` we hope to signal to both Resend's system and any mail security tools downstream that the email is part of a simulation and does not have any malicious intent.

>[!Summary]
>
>**Problem:**
>Resend has an AI filtering system that can block us.
>**Solution:**
>- We will contact Resend's support team, to be whitelisted.
>- We will use trustworthy URL's.
>- We will use custom header injections.

---
## Fallback - Mailu:

Should Resend prove to be unsuitable for any reason, the fallback option is Mailu. Mailu is a self-hosted, open-source mail server stack that runs natively within a Docker environment. Mailu will easily integrate with our projects structure. Unlike Resend Mailu provides no shared, pre-warmed IP pool and no built-in webhook. Therefore using Mailu will force us to implement a custom interaction tracker for our emails and to adjust our emails to not get flagged and blocked easily. For these reasons, Mailu is held in reserve rather than used immediately.

>[!Summary]
>
>- Mailu is self-hosted, open-source.
>- It does not solve the problems Resend does.
>- We will be forced to implement our own solutions
>

---
## Resend Setup:

1) Create an account.
2) Generate API key and save in .env file as `RESEND_API_KEY=`.
3) Add domain `capstone-five-guys.dns.net.za` in Resend's dashboard.
4) Add necessary DNS record provided.
## How To Use Resend:

1) Install SDK with `npm install resend`.
2) Core logic example:
```
import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resend } from 'resend';
import { PhishingCampaign } from './phishing-campaign.entity';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor(
    // Inject the TypeORM repository for our campaign entity
    @InjectRepository(PhishingCampaign)
    private campaignRepository: Repository<PhishingCampaign>,
  ) {
    // Initialize the Resend SDK
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendSimulationFromDatabase(campaignId: string) {
    try {
      Fetch the campaign configuration from the PostgreSQL database
      const campaign = await this.campaignRepository.findOne({
        where: { id: campaignId },
      });

      // If ID doesn't exist
      if (!campaign) {
        throw new NotFoundException(`Campaign with ID ${campaignId} not found in the database.`);
      }

      const formattedFromAddress = `${campaign.fromName} <simulations@capstone-five-guys.dns.net.za>`;

      // Dispatch the email using the dynamically fetched database variables
      const response = await this.resend.emails.send({
        from: formattedFromAddress,
        to: campaign.targetEmail,
        subject: campaign.subject,
        html: campaign.htmlMessage,
        
        // Inject tracking headers to monitor the simulation
        headers: {
          'X-Phishing-Simulation': 'true',
          'X-Campaign-ID': campaign.id,
        },
      });

      this.logger.log(`Simulation successfully sent to ${campaign.targetEmail}. Resend ID: ${response.data?.id}`);
      return response.data;
      
    } catch (error) {
      this.logger.error(`Failed to send simulation for campaign ID: ${campaignId}`, error);
      throw new InternalServerErrorException('Email delivery failed');
    }
  }
}
```

3) Webhook controller example:
```
import { Controller, Post, Headers, Req, Res, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { WebhookService } from './webhook.service';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Post('resend')
  async handleResendWebhook(
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    try {
      const payload = request.body; 
      const headers = {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      };

      await this.webhookService.processWebhook(payload, headers);

      // Always return a 200 OK quickly so Resend knows you received it
      return response.status(HttpStatus.OK).send({ received: true });
      
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`);
      // Return a 400 status if verification fails
      return response.status(HttpStatus.BAD_REQUEST).send({ error: 'Webhook Error' });
    }
  }
}
```

4) Webhook service example:
```
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Webhook } from 'svix';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  constructor() {}

  async processWebhook(payload: any, headers: Record<string, string>) {
    // Initialize the Svix Webhook verifier with your secret
    const wh = new Webhook(this.webhookSecret);
    let event: any;

    // Verify the signature
    try {
      event = wh.verify(JSON.stringify(payload), headers);
    } catch (err) {
      this.logger.error('Invalid Webhook Signature');
      throw new UnauthorizedException('Invalid Signature');
    }

    // Extract the metadata you passed when sending the email
    // (e.g., the Campaign ID or User ID we set up in the Email Service)
    const eventType = event.type;
    const campaignId = event.data.tags?.['X-Campaign-ID']; 
    const targetEmail = event.data.to[0];

    this.logger.log(`Received secure webhook: ${eventType} for ${targetEmail}`);

    // Handle the specific interaction for the reward/education system
    switch (eventType) {
      case 'email.delivered':
        break;

      case 'email.opened':
        // Maybe trigger a minor penalty in the reward system.
        this.logger.log(`User ${targetEmail} opened the simulation.`);
        break;

      case 'email.clicked':
        // This is where you trigger the specific educational material payload.
        this.logger.warn(`CRITICAL: User ${targetEmail} clicked the link in campaign ${campaignId}!`);
           await this.rewardService.applyPenalty(targetEmail);
           await this.educationService.dispatchMaterial(targetEmail, 'phishing-links');
        break;

      case 'email.bounced':
      case 'email.complained': // User marked it as spam
        this.logger.log(`User ${targetEmail} successfully reported the email as spam.`);
        break;

      default:
        this.logger.debug(`Unhandled event type: ${eventType}`);
    }
  }
}
```
## Resend Example Repository:

[Repository Link](https://github.com/resend/resend-examples/tree/main/nextjs-resend-examples/typescript)

---
## Mailu Setup:

Mailu's setup is much more complicated than Resend's, because self-hosting requires manual configuration of DNS records (SPF, DKIM, DMARC) to build up domain reputation from scratch. Therefore we have only provide a link to a video explaining it, for now. [YouTube: Mailu Setup](https://youtu.be/H6miDtH_BlM?si=MYTIhoZo1VCGs4bx)