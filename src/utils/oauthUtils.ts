import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";

const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirect: process.env.GOOGLE_REDIRECT_URI, // Base URI - specific to doctor callback
};

const oauth2Client = new google.auth.OAuth2(
  googleConfig.clientId,
  googleConfig.clientSecret,
  googleConfig.redirect
);

interface OAuthParams {
  doctorId: number;
  scopes: string[];
  prisma: PrismaClient;
  redirectUri: string; // Specific redirect URI
}

export async function initiateOAuth(params: OAuthParams): Promise<string> {
  const { doctorId, scopes, redirectUri } = params;

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    redirect_uri: redirectUri,
    state: `${doctorId}`,
  });
  return authUrl;
}

interface TokenResult {
  tokens: any;
  calendarId: string;
}

export async function handleOAuthCallback(code: string): Promise<TokenResult> {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const calendarListResponse = await calendar.calendarList.list({
      auth: oauth2Client,
    });
    const calendars = calendarListResponse.data.items;

    if (!calendars || calendars.length === 0) {
      throw new Error("No calendars found in your Google account.");
    }

    const calendarId = calendars[0].id;
    return { tokens, calendarId };
  } catch (error) {
    console.error("Error during OAuth2 flow:", error);
    throw error;
  }
}

interface SaveTokenParams {
  doctorId: number;
  tokens: any;
  calendarId: string;
  prisma: PrismaClient;
}

export async function saveTokensAndCalendarId(
  params: SaveTokenParams
): Promise<void> {
  const { doctorId, tokens, calendarId, prisma } = params;

  try {
    await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        googleRefreshToken: tokens.refresh_token,
        googleCalendarId: calendarId,
      },
    });
  } catch (error) {
    console.error("Error saving tokens and calendar ID:", error);
    throw error;
  }
}
