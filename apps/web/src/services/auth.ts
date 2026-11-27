import {
  API_PREFIX,
  AUTH_REQUEST_HEADER,
  sessionSchema,
  type LoginInput,
  type RegisterInput,
  type Session,
} from "@kisan/contracts";
import { z } from "zod";
import { demoAuth } from "../mocks/auth";

export interface AuthClient {
  me(): Promise<Session | null>;
  login(input: LoginInput): Promise<Session>;
  register(input: RegisterInput): Promise<void>;
  logout(): Promise<void>;
}

async function request(path: string, body?: object) {
  return fetch(
    `${API_PREFIX}/auth/${path}`,
    body && {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [AUTH_REQUEST_HEADER]: "1",
      },
      body: JSON.stringify(body),
    },
  );
}

const sessionResponse = z.object({ data: sessionSchema });
const httpAuth: AuthClient = {
  async me() {
    const response = await request("me");
    if (response.status === 401) return null;
    if (!response.ok) throw new Error("AUTH_UNAVAILABLE");
    return sessionResponse.parse(await response.json()).data;
  },
  async login(input) {
    const response = await request("login", input);
    if (!response.ok)
      throw new Error(
        response.status === 401 ? "INVALID_CREDENTIALS" : "AUTH_UNAVAILABLE",
      );
    return sessionResponse.parse(await response.json()).data;
  },
  async register(input) {
    const response = await request("register", input);
    if (!response.ok)
      throw new Error(
        response.status === 400 ? "REGISTRATION_REJECTED" : "AUTH_UNAVAILABLE",
      );
  },
  async logout() {
    if (!(await request("logout", {})).ok) throw new Error("AUTH_UNAVAILABLE");
  },
};

export const authClient =
  import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API === "true"
    ? demoAuth
    : httpAuth;
