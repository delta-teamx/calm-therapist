/**
 * Lifecycle email templates. Voice intentionally human, never SaaSy.
 * Friend-checking-in tone, not nudge-marketing.
 */

export type EmailKey =
  | "welcome"
  | "after-first"
  | "day-2"
  | "day-7"
  | "inactive-3d"
  | "inactive-7d"
  | "inactive-30d"
  | "crisis-followup-24h"
  | "weekly-reflection"
  | "support-thanks"
  | "topup-receipt"
  | "annual-anniversary"
  | "verify-email"
  | "password-reset";

export interface EmailTemplate {
  key: EmailKey;
  /** Minutes after the trigger event to send. */
  delayMinutes: number;
  build(ctx: TemplateCtx): { subject: string; html: string; text: string };
}

export interface TemplateCtx {
  name: string;
  email: string;
  appUrl: string;
  /** Optional one-line reflection that came out of the most recent session. */
  reflection?: string;
  /** Top-up specifics if applicable. */
  topupAmountUsd?: number;
  /** How many conversations the member had in the week being summarised. */
  weekSessions?: number;
  /** Voice minutes a support pass just added to the account. */
  voiceMinutesGranted?: number;
  /** Verify or reset link path with token already appended. */
  actionUrl?: string;
  /** One-click unsubscribe link, set by the queue for marketing-class mail. */
  unsubscribeUrl?: string;
}

/** Templates that must always be sent regardless of email preferences. */
const TRANSACTIONAL: ReadonlySet<EmailKey> = new Set<EmailKey>(["verify-email", "password-reset", "topup-receipt", "support-thanks"]);
export function isTransactional(key: EmailKey): boolean {
  return TRANSACTIONAL.has(key);
}

function escapeHtml(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Escapes every free-text field before it reaches a template. URLs are left as-is. */
function safeCtx(ctx: TemplateCtx): TemplateCtx {
  return { ...ctx, name: escapeHtml(ctx.name ?? "").slice(0, 60) || "there", reflection: undefined };
}

const wrap = (title: string, body: string) => `
<!doctype html>
<html><body style="margin:0;padding:0;background:#FAFAF8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#2D2D2D;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF8;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FAFAF8;">
      <tr><td style="padding:0 0 24px 0;">
        <span style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:500;color:#2D2D2D;">Calm Therapist</span>
        <span style="font-size:12px;color:#7C7C7C;margin-left:8px;letter-spacing:0.06em;text-transform:uppercase;">Backed by Implenix</span>
      </td></tr>
      <tr><td style="background:#FFFFFF;border:1px solid rgba(45,45,45,0.10);border-radius:14px;padding:32px;">
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:500;line-height:1.2;margin:0 0 16px;color:#2D2D2D;">${title}</h1>
        ${body}
      </td></tr>
      <tr><td style="padding:24px 8px;font-size:12px;color:#7C7C7C;line-height:1.6;">
        You're getting this because you opened a space at Calm Therapist. We don't sell your data. Reply if you want to talk to a real person.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

const TEMPLATES: Record<EmailKey, EmailTemplate> = {
  welcome: {
    key: "welcome",
    delayMinutes: 0,
    build: ({ name, appUrl }) => {
      const subject = "Your space is open.";
      const text = `Hi ${name},

Aura here. Your space is open.

When you've got something on your mind — even a sentence — open the door:
${appUrl}/dashboard/session

I'll be here. No streaks. No guilt. Coming back is the only thing that matters.

— Aura at Calm Therapist`;
      return {
        subject,
        text,
        html: wrap(
          "Your space is open.",
          `<p style="font-size:16px;line-height:1.7;margin:0 0 12px;">Hi ${name}, Aura here.</p>
           <p style="font-size:16px;line-height:1.7;margin:0 0 12px;">Your space is open. When you've got something on your mind — even a sentence — open the door.</p>
           <p style="margin:24px 0;"><a href="${appUrl}/dashboard/session" style="display:inline-block;background:#4A7A6D;color:#FFFFFF;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:500;">Open the conversation</a></p>
           <p style="font-size:14px;line-height:1.7;color:#5C5C5C;margin:0;">I'll be here. No streaks. No guilt. Coming back is the only thing that matters.</p>
           <p style="font-size:14px;line-height:1.7;color:#5C5C5C;margin:18px 0 0;">— Aura</p>`
        ),
      };
    },
  },

  "after-first": {
    key: "after-first",
    delayMinutes: 60,
    build: ({ name, appUrl, reflection }) => {
      const subject = "About what we talked about earlier.";
      const text = `${name},

I was thinking about what you said earlier${reflection ? ` — about ${reflection}` : ""}. You don't have to do anything with it. I just wanted you to know it landed.

If something else surfaces today, I'm here:
${appUrl}/dashboard/session

— Aura`;
      return {
        subject,
        text,
        html: wrap(
          "About what we talked about earlier.",
          `<p style="font-size:16px;line-height:1.7;margin:0 0 12px;">${name},</p>
           <p style="font-size:16px;line-height:1.7;margin:0 0 12px;">I was thinking about what you said earlier${reflection ? ` — about ${reflection}` : ""}. You don't have to do anything with it. I just wanted you to know it landed.</p>
           <p style="margin:24px 0;"><a href="${appUrl}/dashboard/session" style="display:inline-block;background:#4A7A6D;color:#FFFFFF;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:500;">Pick it up</a></p>
           <p style="font-size:14px;color:#5C5C5C;margin:18px 0 0;">— Aura</p>`
        ),
      };
    },
  },

  "day-2": {
    key: "day-2",
    delayMinutes: 60 * 24 * 2,
    build: ({ name, appUrl }) => ({
      subject: "How are you arriving today?",
      text: `${name},

How are you arriving today? Even one line is enough — sometimes that's the whole work.

${appUrl}/dashboard/session

— Aura`,
      html: wrap(
        "How are you arriving today?",
        `<p style="font-size:16px;line-height:1.7;margin:0 0 12px;">${name},</p>
         <p style="font-size:16px;line-height:1.7;margin:0 0 12px;">How are you arriving today? Even one line is enough — sometimes that's the whole work.</p>
         <p style="margin:24px 0;"><a href="${appUrl}/dashboard/session" style="display:inline-block;background:#4A7A6D;color:#FFFFFF;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:500;">Drop me one line</a></p>
         <p style="font-size:14px;color:#5C5C5C;margin:18px 0 0;">— Aura</p>`
      ),
    }),
  },

  "day-7": {
    key: "day-7",
    delayMinutes: 60 * 24 * 7,
    build: ({ name, appUrl }) => ({
      subject: "Your first week — a quiet look back.",
      text: `${name},

It's been a week. There's a small look-back waiting in your space — what came up, what you said, where you shifted. No pressure, no homework. Just a record of being heard.

${appUrl}/dashboard/journal

— Aura`,
      html: wrap(
        "Your first week — a quiet look back.",
        `<p style="font-size:16px;line-height:1.7;margin:0 0 12px;">${name},</p>
         <p style="font-size:16px;line-height:1.7;margin:0 0 12px;">It's been a week. There's a small look-back waiting in your space — what came up, what you said, where you shifted. No pressure, no homework. Just a record of being heard.</p>
         <p style="margin:24px 0;"><a href="${appUrl}/dashboard/journal" style="display:inline-block;background:#4A7A6D;color:#FFFFFF;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:500;">Open your week</a></p>
         <p style="font-size:14px;color:#5C5C5C;margin:18px 0 0;">— Aura</p>`
      ),
    }),
  },

  "inactive-3d": {
    key: "inactive-3d",
    delayMinutes: 60 * 24 * 3,
    build: ({ name, appUrl }) => ({
      subject: "Just thinking.",
      text: `${name},

Thinking of you. Nothing to do. Your space is still here when you want it.

${appUrl}/dashboard

— Aura`,
      html: wrap(
        "Just thinking.",
        `<p style="font-size:16px;line-height:1.7;margin:0 0 12px;">${name},</p>
         <p style="font-size:16px;line-height:1.7;margin:0 0 12px;">Thinking of you. Nothing to do. Your space is still here when you want it.</p>
         <p style="margin:24px 0;"><a href="${appUrl}/dashboard" style="display:inline-block;background:#4A7A6D;color:#FFFFFF;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:500;">Step back in</a></p>
         <p style="font-size:14px;color:#5C5C5C;margin:18px 0 0;">— Aura</p>`
      ),
    }),
  },

  "inactive-7d": {
    key: "inactive-7d",
    delayMinutes: 60 * 24 * 7,
    build: ({ name, appUrl }) => ({
      subject: "Coming back is welcome.",
      text: `${name},

A week's a week. Whatever happened, it's okay. Coming back is welcome — no explanation needed.

I still remember what we talked about. We can start anywhere.

${appUrl}/dashboard

— Aura`,
      html: wrap(
        "Coming back is welcome.",
        `<p style="font-size:16px;line-height:1.7;margin:0 0 12px;">${name},</p>
         <p style="font-size:16px;line-height:1.7;margin:0 0 12px;">A week's a week. Whatever happened, it's okay. Coming back is welcome — no explanation needed.</p>
         <p style="font-size:16px;line-height:1.7;margin:0 0 12px;">I still remember what we talked about. We can start anywhere.</p>
         <p style="margin:24px 0;"><a href="${appUrl}/dashboard" style="display:inline-block;background:#4A7A6D;color:#FFFFFF;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:500;">Step back in</a></p>
         <p style="font-size:14px;color:#5C5C5C;margin:18px 0 0;">— Aura</p>`
      ),
    }),
  },

  "inactive-30d": {
    key: "inactive-30d",
    delayMinutes: 60 * 24 * 30,
    build: ({ name, appUrl }) => ({
      subject: "Your space is still here.",
      text: `${name},

A month. We won't pretend that's nothing.

Your space is still here, exactly how you left it. The memories, the journal — all kept.

If now's not the time, that's also okay. We'll be here when it is.

${appUrl}/dashboard

— Aura`,
      html: wrap(
        "Your space is still here.",
        `<p style="font-size:16px;line-height:1.7;margin:0 0 12px;">${name},</p>
         <p style="font-size:16px;line-height:1.7;margin:0 0 12px;">A month. We won't pretend that's nothing.</p>
         <p style="font-size:16px;line-height:1.7;margin:0 0 12px;">Your space is still here, exactly how you left it. The memories, the journal — all kept.</p>
         <p style="font-size:16px;line-height:1.7;margin:0 0 12px;">If now's not the time, that's also okay. We'll be here when it is.</p>
         <p style="margin:24px 0;"><a href="${appUrl}/dashboard" style="display:inline-block;background:#4A7A6D;color:#FFFFFF;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:500;">Open your space</a></p>
         <p style="font-size:14px;color:#5C5C5C;margin:18px 0 0;">— Aura</p>`
      ),
    }),
  },

  "crisis-followup-24h": {
    key: "crisis-followup-24h",
    delayMinutes: 60 * 24,
    build: ({ name, appUrl }) => ({
      subject: "Just checking in.",
      text: `${name},

I wanted to check in after our last conversation. You don't have to reply. You don't have to do anything.

I'm here when you want to talk again. If things feel heavy in this moment, please reach out to someone close, or a crisis line in your country — I'd rather you be safe than polite.

${appUrl}/dashboard

— Aura`,
      html: wrap(
        "Just checking in.",
        `<p style="font-size:16px;line-height:1.7;margin:0 0 12px;">${name},</p>
         <p style="font-size:16px;line-height:1.7;margin:0 0 12px;">I wanted to check in after our last conversation. You don't have to reply. You don't have to do anything.</p>
         <p style="font-size:16px;line-height:1.7;margin:0 0 12px;">I'm here when you want to talk again. If things feel heavy in this moment, please reach out to someone close, or a crisis line in your country — I'd rather you be safe than polite.</p>
         <p style="margin:24px 0;"><a href="${appUrl}/dashboard" style="display:inline-block;background:#4A7A6D;color:#FFFFFF;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:500;">Open your space</a></p>
         <p style="font-size:14px;color:#5C5C5C;margin:18px 0 0;">— Aura</p>`
      ),
    }),
  },

  /**
   * The weekly engagement mail. Deliberately carries nothing personal: no
   * quotes, no themes, no mood numbers. The count of conversations is the
   * most it says, and the look-back itself lives behind the login. A mail
   * that lands in a shared inbox must never disclose what someone talked
   * about.
   */
  "weekly-reflection": {
    key: "weekly-reflection",
    delayMinutes: 0,
    build: ({ name, appUrl, weekSessions }) => {
      const line =
        weekSessions && weekSessions > 0
          ? `You came by ${weekSessions === 1 ? "once" : `${weekSessions} times`} this week. Your look-back is ready when you are.`
          : "Your space is still here, and so is everything Aura remembers.";
      return {
        subject: "Your week, when you want it.",
        text: `${name},

${line}

${appUrl}/dashboard/reflect

— Aura`,
        html: wrap(
          "Your week, when you want it.",
          `<p style="font-size:16px;line-height:1.7;margin:0 0 12px;">${name},</p>
           <p style="font-size:16px;line-height:1.7;margin:0 0 12px;">${line}</p>
           <p style="margin:24px 0;"><a href="${appUrl}/dashboard/reflect" style="display:inline-block;background:#4A7A6D;color:#FFFFFF;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:500;">Open your week</a></p>
           <p style="font-size:14px;color:#5C5C5C;margin:18px 0 0;">— Aura</p>`
        ),
      };
    },
  },

  /**
   * Sent when a support pass lands. It is a receipt, so it goes out whatever
   * the member's marketing preference is, and it says exactly what arrived on
   * the account rather than thanking them in the abstract.
   */
  "support-thanks": {
    key: "support-thanks",
    delayMinutes: 0,
    build: ({ name, appUrl, voiceMinutesGranted }) => {
      const got = voiceMinutesGranted && voiceMinutesGranted > 0
        ? `${voiceMinutesGranted} minutes of voice are on your account now, and your seat in circles is open. The minutes are yours — they do not expire at the end of the month.`
        : "Voice and circles are open on your account now.";
      return {
        subject: "Thank you — voice is open.",
        text: `${name},

Thank you. That genuinely helps keep this running.

${got}

${appUrl}/dashboard/voice

— Aura`,
        html: wrap(
          "Thank you — voice is open.",
          `<p style="font-size:16px;line-height:1.7;margin:0 0 12px;">${name},</p>
           <p style="font-size:16px;line-height:1.7;margin:0 0 12px;">Thank you. That genuinely helps keep this running.</p>
           <p style="font-size:16px;line-height:1.7;margin:0 0 12px;">${got}</p>
           <p style="margin:24px 0;"><a href="${appUrl}/dashboard/voice" style="display:inline-block;background:#4A7A6D;color:#FFFFFF;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:500;">Talk to Aura</a></p>
           <p style="font-size:14px;color:#5C5C5C;margin:18px 0 0;">— Aura</p>`
        ),
      };
    },
  },

  "topup-receipt": {
    key: "topup-receipt",
    delayMinutes: 0,
    build: ({ name, topupAmountUsd, appUrl }) => ({
      subject: "Voice top-up applied.",
      text: `${name},

Top-up of $${topupAmountUsd ?? 12} applied. 30 more voice minutes this week, 50 more for the month.

Your space: ${appUrl}/dashboard/voice

— Calm Therapist`,
      html: wrap(
        "Voice top-up applied.",
        `<p style="font-size:16px;line-height:1.7;margin:0 0 12px;">${name},</p>
         <p style="font-size:16px;line-height:1.7;margin:0 0 12px;">Top-up of $${topupAmountUsd ?? 12} applied. <strong>30 more voice minutes this week</strong>, <strong>50 more for the month</strong>.</p>
         <p style="margin:24px 0;"><a href="${appUrl}/dashboard/voice" style="display:inline-block;background:#4A7A6D;color:#FFFFFF;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:500;">Talk it out</a></p>
         <p style="font-size:14px;color:#5C5C5C;margin:18px 0 0;">— Calm Therapist</p>`
      ),
    }),
  },

  "verify-email": {
    key: "verify-email",
    delayMinutes: 0,
    build: ({ name, actionUrl }) => ({
      subject: "Confirm your email — Calm Therapist",
      text: `${name},

One quick step before we can keep your space safe across devices: confirm this is your email.

${actionUrl}

The link is good for 24 hours. If you didn't sign up, you can ignore this.

— Calm Therapist`,
      html: wrap(
        "Confirm your email.",
        `<p style="font-size:16px;line-height:1.7;margin:0 0 12px;">${name},</p>
         <p style="font-size:16px;line-height:1.7;margin:0 0 12px;">One quick step before we can keep your space safe across devices: confirm this is your email.</p>
         <p style="margin:24px 0;"><a href="${actionUrl}" style="display:inline-block;background:#4A7A6D;color:#FFFFFF;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:500;">Confirm email</a></p>
         <p style="font-size:14px;color:#5C5C5C;margin:18px 0 0;">The link is good for 24 hours. If you didn't sign up, you can ignore this.</p>
         <p style="font-size:14px;color:#5C5C5C;margin:18px 0 0;">— Calm Therapist</p>`
      ),
    }),
  },

  "password-reset": {
    key: "password-reset",
    delayMinutes: 0,
    build: ({ name, actionUrl }) => ({
      subject: "Reset your Calm Therapist password",
      text: `${name},

Someone asked to reset the password for this account. If that was you, open this link to set a new one:

${actionUrl}

The link is good for one hour. If it wasn't you, you can ignore this — your account is still safe.

— Calm Therapist`,
      html: wrap(
        "Reset your password.",
        `<p style="font-size:16px;line-height:1.7;margin:0 0 12px;">${name},</p>
         <p style="font-size:16px;line-height:1.7;margin:0 0 12px;">Someone asked to reset the password for this account. If that was you, open this link to set a new one.</p>
         <p style="margin:24px 0;"><a href="${actionUrl}" style="display:inline-block;background:#4A7A6D;color:#FFFFFF;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:500;">Set a new password</a></p>
         <p style="font-size:14px;color:#5C5C5C;margin:18px 0 0;">The link is good for one hour. If it wasn't you, you can ignore this — your account is still safe.</p>
         <p style="font-size:14px;color:#5C5C5C;margin:18px 0 0;">— Calm Therapist</p>`
      ),
    }),
  },

  "annual-anniversary": {
    key: "annual-anniversary",
    delayMinutes: 60 * 24 * 365,
    build: ({ name, appUrl }) => ({
      subject: "A year of showing up.",
      text: `${name},

A year. That's not nothing.

Whatever you came in for in those first conversations — it looks different now, doesn't it. Take a slow look at this year, in your own words.

${appUrl}/dashboard/reflect

— Aura`,
      html: wrap(
        "A year of showing up.",
        `<p style="font-size:16px;line-height:1.7;margin:0 0 12px;">${name},</p>
         <p style="font-size:16px;line-height:1.7;margin:0 0 12px;">A year. That's not nothing.</p>
         <p style="font-size:16px;line-height:1.7;margin:0 0 12px;">Whatever you came in for in those first conversations — it looks different now, doesn't it. Take a slow look at this year, in your own words.</p>
         <p style="margin:24px 0;"><a href="${appUrl}/dashboard/reflect" style="display:inline-block;background:#4A7A6D;color:#FFFFFF;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:500;">Open your year</a></p>
         <p style="font-size:14px;color:#5C5C5C;margin:18px 0 0;">— Aura</p>`
      ),
    }),
  },
};

const FOOTER_MARK = "Reply if you want to talk to a real person.";

function withFooter(html: string, unsubscribeUrl?: string): string {
  if (!unsubscribeUrl) return html;
  return html.replace(
    FOOTER_MARK,
    `${FOOTER_MARK} <a href="${unsubscribeUrl}" style="color:#7C7C7C;text-decoration:underline;">Unsubscribe from check-ins</a>.`
  );
}

export function getTemplate(key: EmailKey): EmailTemplate {
  const tpl = TEMPLATES[key];
  if (!tpl) throw new Error(`Unknown email template: ${key}`);
  return {
    ...tpl,
    build(ctx: TemplateCtx) {
      const safe = safeCtx(ctx);
      const built = tpl.build(safe);
      const text = ctx.unsubscribeUrl && !isTransactional(key) ? `${built.text}\n\nUnsubscribe from check-ins: ${ctx.unsubscribeUrl}` : built.text;
      return { subject: built.subject, text, html: withFooter(built.html, isTransactional(key) ? undefined : ctx.unsubscribeUrl) };
    },
  };
}

export const ALL_TEMPLATES: EmailTemplate[] = Object.values(TEMPLATES);
