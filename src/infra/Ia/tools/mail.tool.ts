import { Injectable } from '@nestjs/common';
import { MailService } from '../../mail/mail.service';
import { AgentFunction } from '@nestjs/ai';
import z from 'zod';

@Injectable()
export class MailTools {
  constructor(private readonly mailService: MailService) {}

  @AgentFunction({
    name: 'send-email',
    description: 'Send a plain text email',
    inputSchema: z.object({
      to: z.email().describe('Recipient email address'),
      subject: z.string().describe('Subject of the email'),
      bodyText: z.string().describe('Plain text body of the email'),
    }),
  })
  async sendEmail(inputSchema: {
    to: string;
    subject: string;
    bodyText: string;
  }) {
    await this.mailService.sendEmail(inputSchema);
    return { success: true, message: `E-mail enviado para ${inputSchema.to}` };
  }

  @AgentFunction({
    name: 'send-email-pdf',
    description:
      'Send an email with a PDF attachment. Use the pdfBase64 returned by the make-pdf tool.',
    inputSchema: z.object({
      to: z.email().describe('Recipient email address'),
      subject: z.string().describe('Subject of the email'),
      bodyHtml: z.string().describe('HTML body of the email'),
      pdfBase64: z
        .string()
        .min(1)
        .describe('PDF content encoded in base64 (returned by make-pdf)'),
      filename: z
        .string()
        .default('documento.pdf')
        .describe('Attachment file name, e.g. relatorio.pdf'),
    }),
  })
  async sendEmailInPdf(inputSchema: {
    to: string;
    subject: string;
    bodyHtml: string;
    pdfBase64: string;
    filename: string;
  }) {
    await this.mailService.sendEmailWithAttachment(inputSchema);
    return {
      success: true,
      message: `E-mail com PDF enviado para ${inputSchema.to}`,
    };
  }

  @AgentFunction({
    name: 'make-pdf',
    description:
      'Generate a PDF from a title and content. Returns the PDF as base64, which can be passed to send-email-pdf.',
    inputSchema: z.object({
      title: z.string().describe('Title shown at the top of the PDF'),
      content: z.string().describe('Text content of the PDF'),
    }),
  })
  async makePdf(inputSchema: { title: string; content: string }) {
    const buffer = await this.mailService.generatePdfBuffer(inputSchema);
    return { pdfBase64: buffer.toString('base64') };
  }
}
