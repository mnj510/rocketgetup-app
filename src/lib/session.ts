import type { SessionOptions } from "iron-session";

export interface SessionUser {
  memberId: string;
  name?: string;
}

export const sessionOptions: SessionOptions = {
  cookieName: "rocketgetup_session",
  password: process.env.SESSION_PASSWORD || "dev-only-password-change-me-32chars",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};



