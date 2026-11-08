import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SESClient,
  SendEmailCommand,
  SendRawEmailCommand,
} from '@aws-sdk/client-ses';
import PDFDocument from 'pdfkit';
import z from 'zod';

export const pdfBufferSchema = z
  .instanceof(Buffer, {
    message: 'O arquivo precisa ser um Buffer válido do Node.js',
  })
  .refine((buffer) => buffer.length > 0, {
    message: 'O buffer do PDF não pode estar vazio',
  })
  .refine(
    (buffer) => {
      // Verifica se os primeiros 5 bytes correspondem à assinatura "%PDF-"
      if (buffer.length < 5) return false;
      const header = buffer.toString('ascii', 0, 5);
      return header === '%PDF-';
    },
    {
      message:
        'O Buffer fornecido não é um arquivo PDF válido (assinatura %PDF- ausente)',
    },
  );

@Injectable()
export class MailService {
  private readonly sesClient: SESClient;
  private readonly logger = new Logger(MailService.name);
  private readonly senderEmail: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION') as string;
    const accessKeyId = this.configService.get<string>(
      'AWS_ACCESS_KEY_ID',
    ) as string;
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    ) as string;

    this.sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.senderEmail = this.configService.get<string>(
      'AWS_SES_FROM_EMAIL',
    ) as string;
  }

  async generatePdfBuffer(inputSchema: {
    title: string;
    content: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err: Error) => reject(err));

      doc.fontSize(20).text(inputSchema.title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(inputSchema.content);
      doc.end();
    });
  }

  async sendEmail(inputSchema: {
    to: string;
    subject: string;
    bodyText: string;
    bodyHtml?: string;
  }): Promise<void> {
    const command = new SendEmailCommand({
      Source: this.senderEmail,
      Destination: {
        ToAddresses: [inputSchema.to],
      },
      Message: {
        Subject: {
          Data: inputSchema.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Text: {
            Data: inputSchema.bodyText,
            Charset: 'UTF-8',
          },
          ...(inputSchema.bodyHtml && {
            Html: {
              Data: inputSchema.bodyHtml,
              Charset: 'UTF-8',
            },
          }),
        },
      },
    });

    try {
      const response = await this.sesClient.send(command);
      this.logger.log(
        `E-mail enviado com sucesso! MessageId: ${response.MessageId}`,
      );
    } catch (error) {
      this.logger.error('Erro ao enviar e-mail via AWS SES', error);
      throw error;
    }
  }

  async sendEmailWithAttachment(inputSchema: {
    to: string;
    subject: string;
    bodyHtml: string;
    pdfBuffer?: Buffer;
    pdfBase64?: string;
    filename: string;
  }): Promise<void> {
    // Resolve o PDF a partir de base64 ou Buffer
    let pdfBuffer: Buffer | undefined = inputSchema.pdfBuffer;

    if (inputSchema.pdfBase64) {
      const rawBuffer = Buffer.from(inputSchema.pdfBase64, 'base64');
      const validationResult = pdfBufferSchema.safeParse(rawBuffer);

      if (!validationResult.success) {
        throw new BadRequestException(
          `PDF inválido: ${validationResult.error.message}`,
        );
      }
      pdfBuffer = validationResult.data;
    }

    if (!pdfBuffer) {
      throw new BadRequestException('Informe pdfBuffer ou pdfBase64');
    }

    // Evita header injection
    const clean = (value: string) => value.replace(/[\r\n"]/g, '').trim();
    const to = clean(inputSchema.to);
    const filename = clean(inputSchema.filename);
    const subject = `=?UTF-8?B?${Buffer.from(inputSchema.subject, 'utf-8').toString('base64')}?=`;

    const chunk = (b64: string) => b64.match(/.{1,76}/g)?.join('\r\n') ?? b64;
    const boundary = '----=_Part_' + Date.now();

    const rawMessage = [
      `From: ${this.senderEmail}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      chunk(Buffer.from(inputSchema.bodyHtml, 'utf-8').toString('base64')),
      '',
      `--${boundary}`,
      `Content-Type: application/pdf; name="${filename}"`,
      `Content-Disposition: attachment; filename="${filename}"`,
      'Content-Transfer-Encoding: base64',
      '',
      chunk(pdfBuffer.toString('base64')),
      '',
      `--${boundary}--`,
    ].join('\r\n');

    const command = new SendRawEmailCommand({
      RawMessage: { Data: Buffer.from(rawMessage) },
    });

    try {
      const response = await this.sesClient.send(command);
      this.logger.log(
        `E-mail com PDF enviado com sucesso! MessageId: ${response.MessageId}`,
      );
    } catch (error) {
      this.logger.error('Erro ao enviar e-mail com anexo via AWS SES', error);
      throw error;
    }
  }
}
