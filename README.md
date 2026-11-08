# Project Name

A [NestJS](https://nestjs.com/) application that exposes **tools for an AI agent** capable of generating PDFs and sending emails through **AWS SES**.

From a natural-language conversation, the agent can write a simple email, generate a PDF from a title and content, and send that PDF as an attachment to a recipient.

## Features

- **`send-email`**: sends a plain text email.
- **`make-pdf`**: generates a PDF (title + content) and returns the file as base64.
- **`send-email-pdf`**: sends an HTML email with a PDF attachment (uses the `pdfBase64` returned by `make-pdf`).

Example agent flow:

1. User: "Write a report about X and send it to someone@example.com"
2. The agent calls `make-pdf` and receives the `pdfBase64`.
3. The agent calls `send-email-pdf` with the `pdfBase64`, recipient, subject, and body.

## Tech Stack

- [NestJS](https://nestjs.com/) + TypeScript
- [@nestjs/ai](https://www.npmjs.com/package/@nestjs/ai) (`@AgentFunction`)
- [AWS SES](https://aws.amazon.com/ses/) (`@aws-sdk/client-ses`)
- [PDFKit](https://pdfkit.org/) for PDF generation
- [Zod](https://zod.dev/) for schema validation

## Project Structure

```
src/
├── domain
    └──users
├── Infra
    └──mail/
       └── mail.service.ts        # Email sending (SES) and PDF generation
    └── ai/
        └── tools/
            └── mail.tools.ts      # Tools exposed to the agent
```

> Adjust the paths above to match your actual project structure.

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or higher
- npm, yarn, or pnpm
- An AWS account with **SES** configured:
  - A **verified** sender (or domain) in SES
  - If the account is in the *sandbox*, recipients must be verified too
  - IAM credentials with `ses:SendEmail` and `ses:SendRawEmail` permissions
- API key/credentials for the AI provider used by `@nestjs/ai`

## Installation

```bash
# clone the repository
git clone https://github.com/your-username/your-repository.git
cd your-repository

# install dependencies
npm install
```

## Configuration

Create a `.env` file in the project root:

```env
# AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_SES_FROM_EMAIL=sender@yourdomain.com

# AI provider (adjust to the provider you use)
# OPENAI_API_KEY=your_key
```

| Variable                | Description                                  |
| ----------------------- | -------------------------------------------- |
| `AWS_REGION`            | AWS region where SES is configured           |
| `AWS_ACCESS_KEY_ID`     | IAM user access key                          |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key                          |
| `AWS_SES_FROM_EMAIL`    | Sender email verified in SES                 |

> **Never** commit the `.env` file. Make sure it is listed in `.gitignore`.

## Running the App

```bash
# development (watch mode)
npm run start:dev

# development
npm run start

# production
npm run build
npm run start:prod
```

By default, NestJS runs at `http://localhost:3000` (or the port defined in `PORT`).

## Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# coverage
npm run test:cov
```

## Important Notes

- **PDF validation**: the received `pdfBase64` is decoded and validated (non-empty buffer and `%PDF-` signature) before sending.
- **Header safety**: `to` and `filename` are sanitized against header injection (`\r`, `\n`), and the subject is UTF-8 encoded (base64) to support accented characters.
- **PDF font**: PDFKit uses Helvetica by default, which covers Latin accents but **not** emojis or other alphabets. Register a custom font if you need them.
- **PDF size**: since the base64 passes through the model's context, large PDFs consume many tokens. For bigger files, consider storing the PDF in a cache/storage and passing only an identifier between tools.

