import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error("SMTP Connection Error:", error);
  } else {
    console.log("SMTP Server is ready to take our messages");
  }
});

export async function sendEventConfirmationEmail(
  organiserEmail: string,
  organiserName: string,
  eventTitle: string,
) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: organiserEmail,
      subject: `Payment Made & Event Listed - EDUVENTS`,
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; color: #333;">
                    <h2 style="color: #0F172A; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Payment Confirmation</h2>
                    <p>Hi ${organiserName},</p>
                    <p>Thank you for your payment. This email confirms that we have successfully received your payment for listing your event <strong>"${eventTitle}"</strong> on our website.</p>
                    <p>Your payment has been recorded and processed successfully.</p>
                    <p>Your event is currently under review. You will receive a separate notification informing you whether your event has been approved or rejected. The review process will be completed within 24 hours.</p>
                    <p>If you have any questions in the meantime, please feel free to contact us. Thank you for choosing our platform.</p>
                    <p>Best regards,<br><strong>EDUVENTS Team</strong></p>
                    <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                    <p style="font-size: 12px; color: #64748b;">This is an automated message. Please do not reply to this email.</p>
                </div>
            `,
      text: `
Hi ${organiserName},

Thank you for your payment. This email confirms that we have successfully received your payment for listing your event "${eventTitle}" on our website.

Your payment has been recorded and processed successfully.

Your event is currently under review. You will receive a separate notification informing you whether your event has been approved or rejected. The review process will be completed within 24 hours.

If you have any questions in the meantime, please feel free to contact us. Thank you for choosing our platform.

Best regards,
EDUVENTS Team
            `,
    };

    console.log(
      `Attempting to send payment confirmation email to ${organiserEmail}...`,
    );
    const info = await transporter.sendMail(mailOptions);
    console.log(
      `Payment confirmation email sent successfully: ${info.messageId}`,
    );
    return true;
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    return false;
  }
}

export async function sendAdminNewEventNotification(eventData: any) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: process.env.ADMIN_EMAIL || "info@doceoconsulting.co.uk",
      subject: `New Event Submission: ${eventData.title}`,
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #0F172A;">New Event Awaiting Review</h2>
                    <p>A new event has been submitted and is awaiting your approval.</p>
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Title:</strong> ${eventData.title}</p>
                        <p><strong>Organiser:</strong> ${eventData.organiser}</p>
                        <p><strong>Email:</strong> ${eventData.organiserEmail}</p>
                        <p><strong>Date:</strong> ${eventData.date}</p>
                    </div>
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin" style="background-color: #0F172A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Admin Dashboard</a>
                </div>
            `,
    };

    console.log(
      `Attempting to send admin notification for event: ${eventData.title}...`,
    );
    const info = await transporter.sendMail(mailOptions);
    console.log(`Admin notification sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("Error sending admin notification:", error);
    return false;
  }
}

export async function sendEventExpiredEmail(
  organiserEmail: string,
  organiserName: string,
  eventTitle: string,
) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: organiserEmail,
      subject: `Your Event Has Expired – EDUVENTS`,
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; color: #333;">
                    <h2 style="color: #0F172A; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">Event Expired</h2>
                    <p>Hi ${organiserName},</p>
                    <p>Your event <strong>"${eventTitle}"</strong> has now expired as it has passed its event date. It has been removed from the EDUVENTS marketplace.</p>
                    <p>If you would like to relist a new event, you can do so at any time by visiting your dashboard.</p>
                    <div style="margin: 30px 0;">
                        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/list-event" style="background-color: #0F172A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">List a New Event</a>
                    </div>
                    <p>Best regards,<br><strong>The EDUVENTS Team</strong></p>
                    <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                    <p style="font-size: 12px; color: #64748b;">This is an automated message. Please do not reply to this email.</p>
                </div>
            `,
      text: `
Hi ${organiserName},

Your event "${eventTitle}" has now expired as it has passed its event date. It has been removed from the EDUVENTS marketplace.

If you would like to relist a new event, you can do so at any time by visiting your dashboard.

Best regards,
The EDUVENTS Team
            `,
    };

    console.log(
      `Attempting to send event expired email to ${organiserEmail}...`,
    );
    const info = await transporter.sendMail(mailOptions);
    console.log(`Event expired email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("Error sending event expired email:", error);
    return false;
  }
}

export async function sendSiteUserWelcomeEmail(
  email: string,
  name: string,
) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: `Welcome to EDUVENTS – Your Account Is Ready`,
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; color: #333;">
                    <h2 style="color: #0F172A; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Welcome to EDUVENTS!</h2>
                    <p>Hi ${name},</p>
                    <p>Welcome to EDUVENTS! Your account has been successfully created.</p>
                    <p>You can now discover and save educational events tailored to your interests.</p>
                    <p>Best regards,<br><strong>The EDUVENTS Team</strong></p>
                    <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                    <p style="font-size: 12px; color: #64748b;">This is an automated message. Please do not reply to this email.</p>
                </div>
            `,
      text: `Hi ${name},\n\nWelcome to EDUVENTS! Your account has been successfully created.\n\nYou can now discover and save educational events tailored to your interests.\n\nBest regards,\nThe EDUVENTS Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Site user welcome email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("Error sending site user welcome email:", error);
    return false;
  }
}

export async function sendOrganiserWelcomeEmail(
  email: string,
  name: string,
) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: `Welcome to EDUVENTS – Your Organiser Account Is Ready`,
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; color: #333;">
                    <h2 style="color: #0F172A; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Welcome to EDUVENTS!</h2>
                    <p>Hi ${name},</p>
                    <p>Welcome to EDUVENTS! Your organiser account has been successfully created.</p>
                    <p>You can now log in to your dashboard to start listing events and tracking your performance.</p>
                    <p>Best regards,<br><strong>The EDUVENTS Team</strong></p>
                    <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                    <p style="font-size: 12px; color: #64748b;">This is an automated message. Please do not reply to this email.</p>
                </div>
            `,
      text: `Hi ${name},\n\nWelcome to EDUVENTS! Your organiser account has been successfully created.\n\nYou can now log in to your dashboard to start listing events and tracking your performance.\n\nBest regards,\nThe EDUVENTS Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return false;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string,
) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: `Password Reset – EDUVENTS`,
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; color: #333;">
                    <h2 style="color: #0F172A; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Password Reset Request</h2>
                    <p>Hi ${name},</p>
                    <p>We received a request to reset your password for your EDUVENTS account. Click the button below to set a new password:</p>
                    <div style="margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #0F172A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                    </div>
                    <p>This link will expire in 1 hour. If you didn't request this reset, you can safely ignore this email.</p>
                    <p>Best regards,<br><strong>The EDUVENTS Team</strong></p>
                    <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                    <p style="font-size: 12px; color: #64748b;">This is an automated message. Please do not reply to this email.</p>
                </div>
            `,
      text: `Hi ${name},\n\nWe received a request to reset your password. Visit this link to set a new password: ${resetUrl}\n\nThis link expires in 1 hour.\n\nBest regards,\nThe EDUVENTS Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return false;
  }
}

export async function sendEventEditNotificationToAdmin(
  eventTitle: string,
  organiserName: string,
) {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: process.env.ADMIN_EMAIL || "info@doceoconsulting.co.uk",
      subject: `Event Edited – Re-Review Required – EDUVENTS`,
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; color: #333;">
                    <h2 style="color: #0F172A; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">Event Edited – Re-Review Required</h2>
                    <p>Hi Admin,</p>
                    <p>An approved event has been edited by its organiser and requires re-review before being republished.</p>
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Event Title:</strong> ${eventTitle}</p>
                        <p><strong>Organiser:</strong> ${organiserName}</p>
                    </div>
                    <p>Please review this event in the Admin Dashboard.</p>
                    <div style="margin: 30px 0;">
                        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin" style="background-color: #0F172A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Admin Dashboard</a>
                    </div>
                    <p>Best regards,<br><strong>The EDUVENTS Team</strong></p>
                </div>
            `,
      text: `Hi Admin,\n\nAn approved event has been edited by its organiser and requires re-review before being republished.\n\nEvent Title: ${eventTitle}\nOrganiser: ${organiserName}\n\nPlease review this event in the Admin Dashboard.\n\nBest regards,\nThe EDUVENTS Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `Admin edit notification sent successfully: ${info.messageId}`,
    );
    return true;
  } catch (error) {
    console.error("Error sending admin edit notification:", error);
    return false;
  }
}

export async function sendStatusUpdateEmail(
  organiserEmail: string,
  organiserName: string,
  eventTitle: string,
  status: "approved" | "rejected",
  eventSlug: string,
) {
  try {
    const isApproved = status === "approved";
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: organiserEmail,
      subject: `Event Review Update: ${eventTitle}`,
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: ${isApproved ? "#10b981" : "#ef4444"};">${isApproved ? "Event Approved!" : "Event Not Approved"}</h2>
                    <p>Dear ${organiserName},</p>
                    <p>We have completed the review for your event <strong>"${eventTitle}"</strong>.</p>
                    ${
                      isApproved
                        ? `<p>Your event has been <strong>approved</strong> and is now live on our website.</p>
                           <div style="margin: 30px 0;">
                               <a href="${process.env.NEXT_PUBLIC_BASE_URL}/event/${eventSlug}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Live Event</a>
                           </div>`
                        : `<p>Unfortunately, your event submission has been <strong>rejected</strong> at this time. If you have any questions or would like to appeal this decision, please contact us.</p>`
                    }
                    <p>Thank you for choosing EDUVENTS!</p>
                </div>
            `,
    };

    console.log(
      `Attempting to send status update email (${status}) to ${organiserEmail}...`,
    );
    const info = await transporter.sendMail(mailOptions);
    console.log(`Status update email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("Error sending status update email:", error);
    return false;
  }
}
