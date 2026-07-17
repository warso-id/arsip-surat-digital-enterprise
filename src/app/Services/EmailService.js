// EmailService.js - Email Notification Service
class EmailService {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.token = localStorage.getItem('auth_token');
    }

    async sendWelcomeEmail(email, name) {
        try {
            const payload = this.encode({
                action: 'email_send_welcome',
                email: email,
                name: name,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Send welcome email error:', error);
            return { success: false };
        }
    }

    async sendResetPasswordEmail(email, token) {
        try {
            const resetLink = `${window.location.origin}/reset-password?token=${token}`;

            const payload = this.encode({
                action: 'email_send_reset_password',
                email: email,
                reset_link: resetLink,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Send reset password email error:', error);
            return { success: false };
        }
    }

    async sendDisposisiNotification(email, disposisiData) {
        try {
            const payload = this.encode({
                action: 'email_send_disposisi',
                email: email,
                disposisi: {
                    no_disposisi: disposisiData.no_disposisi,
                    dari: disposisiData.dari_nama,
                    instruksi: disposisiData.instruksi,
                    batas_waktu: disposisiData.batas_waktu
                },
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Send disposisi notification error:', error);
            return { success: false };
        }
    }

    async sendStatusUpdateEmail(email, statusData) {
        try {
            const payload = this.encode({
                action: 'email_send_status_update',
                email: email,
                status: statusData,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Send status update email error:', error);
            return { success: false };
        }
    }

    async sendReminderEmail(email, reminderData) {
        try {
            const payload = this.encode({
                action: 'email_send_reminder',
                email: email,
                reminder: reminderData,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Send reminder email error:', error);
            return { success: false };
        }
    }

    async sendReportEmail(email, reportData) {
        try {
            const payload = this.encode({
                action: 'email_send_report',
                email: email,
                report: reportData,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Send report email error:', error);
            return { success: false };
        }
    }

    async getEmailTemplates() {
        try {
            const payload = this.encode({
                action: 'email_get_templates',
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Get email templates error:', error);
            return { success: false, data: [] };
        }
    }

    async updateEmailTemplate(templateId, data) {
        try {
            const payload = this.encode({
                action: 'email_update_template',
                template_id: templateId,
                data: data,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decode(result.data);

        } catch (error) {
            console.error('Update email template error:', error);
            return { success: false };
        }
    }

    encode(data) {
        return btoa(encodeURIComponent(JSON.stringify(data)));
    }

    decode(encoded) {
        try {
            return JSON.parse(decodeURIComponent(atob(encoded)));
        } catch (error) {
            return {};
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailService;
}
