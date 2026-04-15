import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter;

async function initMailer() {
  if (env.smtpUser && env.smtpPass) {
    // Standard SMTP setup (e.g. Gmail)
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465, 
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
    console.log("Mailer configured with real SMTP:", env.smtpUser);
  } else {
    console.warn("SMTP_USER and SMTP_PASS are missing in .env! Falling back to console-only logging.");
  }
}

export async function sendOtpEmail(to, otp) {
  if (!transporter && (env.smtpUser && env.smtpPass)) {
    await initMailer();
  }

  // If still no transporter (because no env vars), just log and gracefully return
  if (!transporter) {
    console.warn(`\n[DRY RUN] OTP EMAIL DISPATCHED TO: ${to}`);
    console.warn(`[DRY RUN] OTP CODE IS: ${otp}\n`);
    return { info: { messageId: "dry_run" }, previewUrl: "" };
  }

  const info = await transporter.sendMail({
    from: `"Blood Bank Cloud" <${env.smtpUser}>`,
    to: to,
    subject: "Your Registration OTP",
    text: `Your OTP for Blood Bank Cloud registration is: ${otp}. It expires in 10 minutes.`,
    html: `<p>Your OTP for Blood Bank Cloud registration is: <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
  });

  console.log("OTP Email dynamically sent to actual recipient: %s", to);
  return { info, previewUrl: "" };
}

export async function sendAppointmentEmail(to, details) {
  if (!transporter && (env.smtpUser && env.smtpPass)) {
    await initMailer();
  }

  if (!transporter) {
    console.warn(`\n[DRY RUN] APPOINTMENT EMAIL DISPATCHED TO: ${to}`);
    return { info: { messageId: "dry_run" } };
  }

  const { hospitalName, type, date } = details;
  const visitType = type === 'AT_HOME' ? 'Home Collection' : 'Hospital Visit';
  const displayDate = date ? new Date(date).toLocaleDateString() : 'To Be Confirmed';

  const info = await transporter.sendMail({
    from: `"Blood Bank Cloud" <${env.smtpUser}>`,
    to: to,
    subject: "Donation Appointment Confirmed",
    text: `Thank you! Your ${visitType} appointment has been successfully requested.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e53e3e;">Thank you for stepping up to donate!</h2>
        <p>Your <strong>${visitType}</strong> appointment has been successfully requested.</p>
        <div style="background: #f7fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
           <p style="margin: 5px 0;"><strong>Hospital:</strong> ${hospitalName || 'Pending Assignment'}</p>
           <p style="margin: 5px 0;"><strong>Date:</strong> ${displayDate}</p>
        </div>
        <p>We will notify you once the hospital assigns a precise schedule.</p>
      </div>
    `,
  });

  console.log("Appointment Email dynamically sent to actual recipient: %s", to);
  return { info };
}

export async function sendSosEmail(toEmails, details) {
  if (!transporter && (env.smtpUser && env.smtpPass)) {
    await initMailer();
  }

  if (!transporter) {
    console.warn(`\n[DRY RUN] EMERGENCY SOS EMAIL DISPATCHED TO: ${toEmails.join(', ')}`);
    return { info: { messageId: "dry_run" } };
  }

  const { hospitalName, bloodGroup, units } = details;

  const info = await transporter.sendMail({
    from: `"Blood Bank Cloud SOS" <${env.smtpUser}>`,
    to: toEmails.join(', '),
    subject: `🚨 URGENT SOS: ${hospitalName} needs ${bloodGroup} Blood!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #e53e3e; border-radius: 8px; overflow: hidden;">
        <div style="background: #e53e3e; color: white; padding: 20px; text-align: center;">
           <h1 style="margin: 0;">CRITICAL SOS DISPATCH</h1>
        </div>
        <div style="padding: 20px;">
          <p style="font-size: 1.1rem;"><strong>${hospitalName}</strong> has triggered the network alarm.</p>
          <div style="background: #fef2f2; padding: 20px; text-align: center; font-size: 1.4rem; border-radius: 5px; margin: 20px 0; border: 1px solid #fecaca; color: #991b1b;">
             They urgently require <strong>${units} Unit(s)</strong> of <strong>${bloodGroup}</strong> blood.
          </div>
          <p>If you have surplus inventory, please log in to the Central Dashboard immediately to acknowledge and fulfill this request!</p>
          <a href="http://localhost:5173" style="display: block; width: 100%; text-align: center; background: #e53e3e; color: white; text-decoration: none; padding: 15px 0; border-radius: 5px; font-weight: bold; font-size: 1.1rem; margin-top: 20px;">Open Dashboard</a>
        </div>
      </div>
    `,
  });

  console.log("SOS Broadcast Email dynamically sent to: %s", toEmails.join(', '));
  return { info };
}
