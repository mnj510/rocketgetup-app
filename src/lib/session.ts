import type { IronSessionOptions } from "iron-session";

export interface SessionUser {
  memberId: string;
  name?: string;
}

export const sessionOptions: IronSessionOptions = {
  cookieName: "rocketgetup_session",
  password: process.env.SESSION_PASSWORD || "dev-only-password-change-me-32chars",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};


