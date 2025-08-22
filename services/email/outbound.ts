import { ErrorResponse, Resend } from 'resend';
import { NonRetriableError, RetryAfterError } from 'inngest';

export class OutboundEmailService {
    private resendClient: Resend;
    private sender: string;

    constructor() {
        this.resendClient = new Resend(process.env.RESEND_API_KEY);
        const senderEmail = process.env.RESEND_EMAIL_SENDER || 'onboarding@resend.dev';
        const senderName = process.env.RESEND_SENDER_NAME || 'Subsignal';

        this.sender = `"${senderName}" <${senderEmail}>`;
    }

    async sendEmail(recipients: string[] | string, subject: string, reactEmail: React.ReactNode) {
        const { data, error } = await this.resendClient.emails.send({
            from: this.sender,
            to: recipients,
            subject,
            react: reactEmail,
        });

        if (error) {
            console.error(`Error sending email to ${recipients}: ${error.message}`);
            // Resend SDK returns errors in the response object, not as thrown exceptions
            this.handleResendError(error);
        }

        console.log(`Email sent to ${recipients}: ${data}`);
        return data;
    }

    private handleResendError(error: ErrorResponse): never {
        const errorMessage = error.message || 'Unknown error';
        const errorName = error.name || '';

        // Handle Resend error codes based on their predefined status code mapping
        switch (errorName) {
            // 400 - Bad Request (non-retriable)
            case 'invalid_idempotency_key':
                throw new NonRetriableError(`Bad request (400): ${errorMessage}`);

            // 401 - Unauthorized (non-retriable)
            case 'missing_api_key':
                throw new NonRetriableError(`Unauthorized (401): ${errorMessage}`);

            // 403 - Forbidden (non-retriable)
            case 'invalid_api_Key': // Note: This appears to be a typo in Resend SDK
            case 'invalid_from_address':
            case 'validation_error':
                throw new NonRetriableError(`Forbidden (403): ${errorMessage}`);

            // 404 - Not Found (non-retriable)
            case 'not_found':
                throw new NonRetriableError(`Not found (404): ${errorMessage}`);

            // 405 - Method Not Allowed (non-retriable)
            case 'method_not_allowed':
                throw new NonRetriableError(`Method not allowed (405): ${errorMessage}`);

            // 409 - Conflict (non-retriable)
            case 'invalid_idempotent_request':
            case 'concurrent_idempotent_requests':
                throw new NonRetriableError(`Conflict (409): ${errorMessage}`);

            // 422 - Unprocessable Entity (non-retriable)
            case 'missing_required_field':
            case 'invalid_access':
            case 'invalid_parameter':
            case 'invalid_region':
                throw new NonRetriableError(`Unprocessable entity (422): ${errorMessage}`);

            // 429 - Rate Limiting (retriable with delay)
            case 'rate_limit_exceeded':
                throw new RetryAfterError(`Rate limit exceeded (429): ${errorMessage}`, '1h');

            // 500 - Server Errors (retriable)
            case 'application_error':
            case 'internal_server_error':
                throw new Error(`Server error (500): ${errorMessage}`);

            default:
                // For unknown errors, check the error message content
                const lowerMessage = errorMessage.toLowerCase();

                if (
                    lowerMessage.includes('timeout') ||
                    lowerMessage.includes('network') ||
                    lowerMessage.includes('connection')
                ) {
                    throw new Error(`Network error: ${errorMessage}`);
                }

                // Unknown error - treat as non-retriable to be safe
                throw new NonRetriableError(`Unknown email error: ${errorMessage} (${errorName})`);
        }
    }
}
