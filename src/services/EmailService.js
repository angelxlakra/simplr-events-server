const nodemailer = require('nodemailer');

class EmailService {
	transporter;

	constructor() {
		this.transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: Number(process.env.SMTP_PORT),
			secure: true,
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASSWORD,
			},
			logger: true,
			debug: true,
		});
	}

	async sendEmail(to, subject, html, text) {
		console.log({ to, subject, html });
		try {
			const mailOptions = {
				from: `"Simplr Events Team" <${process.env.SMTP_FROM_EMAIL}>`,
				to,
				subject,
				html,
				text, // Fallback plain text version
			};

			const info = await this.transporter.sendMail(mailOptions);
			return { success: true, messageId: info.messageId };
		} catch (error) {
			console.error('Error sending email:', error);
			throw error;
		}
	}
}

module.exports = { EmailService };
