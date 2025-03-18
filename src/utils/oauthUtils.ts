import { google } from "googleapis";
import { PrismaClient } from "@prisma/client";
import logger from "../logger";

export const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirect: process.env.GOOGLE_CALLBACK_URL_DOCTOR,
};

export const oauth2Client = new google.auth.OAuth2(
  googleConfig.clientId,
  googleConfig.clientSecret,
  googleConfig.redirect
);

export const calendar = google.calendar({ version: "v3", auth: oauth2Client });

interface OAuthParams {
  doctorId: string;
  scopes: string[];
  prisma: PrismaClient;
  redirectUri: string; // Specific redirect URI
}

export async function initiateOAuth(params: OAuthParams): Promise<string> {
  const { doctorId, scopes, redirectUri } = params;
  
  logger.info('Initiating OAuth flow', { 
    doctorId,
    scopes,
    redirectUri
  });

  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      redirect_uri: redirectUri,
      state: doctorId,
      prompt: 'consent'
    });

    logger.debug('Generated OAuth URL successfully', { 
      doctorId,
      scopes: scopes.length
    });
    
    return authUrl;
  } catch (error: any) {
    logger.error('Failed to generate OAuth URL', {
      doctorId,
      error: error.message,
      stack: error.stack
    });
    throw new Error(`Failed to initiate OAuth flow: ${error.message}`);
  }
}

interface TokenResult {
  tokens: any;
  calendarId: string;
}

export async function handleOAuthCallback(code: string): Promise<TokenResult> {
  try {
    logger.info('Handling OAuth callback');
    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);
    logger.debug('OAuth tokens received and credentials set');

    
    logger.debug('Fetching calendar list');
    const calendarListResponse = await calendar.calendarList.list({
      auth: oauth2Client,
    });
    const calendars = calendarListResponse.data.items;

    if (!calendars || calendars.length === 0) {
      logger.error('No calendars found in Google account');
      throw new Error("No calendars found in your Google account.");
    }

    const calendarId = calendars[0].id as string;
    logger.info('Successfully retrieved calendar ID', { calendarId });
    
    return { tokens, calendarId };
  } catch (error: any) {
    logger.error('Error during OAuth2 flow', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

interface SaveTokenParams {
  doctorId: string;
  tokens: any;
  calendarId: string;
  prisma: PrismaClient;
}

export async function saveTokensAndCalendarId(params: SaveTokenParams): Promise<void> {
  const { doctorId, tokens, calendarId, prisma } = params;

  try {
    logger.info('Starting to save OAuth tokens and calendar ID', { 
      doctorId,
      calendarId,
      tokenKeys: Object.keys(tokens),
      hasRefreshToken: !!tokens.refresh_token,
      refreshTokenLength: tokens.refresh_token?.length
    });
    
    if (!tokens.refresh_token) {
      logger.error('Missing refresh token in OAuth tokens', { doctorId });
      throw new Error('No refresh token provided');
    }

    // First verify the doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true }
    });

    if (!doctor) {
      logger.error('Doctor not found in database', { doctorId });
      throw new Error(`Doctor with ID ${doctorId} not found in database`);
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { 
        id: doctorId
      },
      data: {
        googleRefreshToken: tokens.refresh_token,
        googleCalendarId: calendarId,
      },
      select: {
        id: true,
        googleRefreshToken: true,
        googleCalendarId: true
      }
    });
    
    logger.info('Successfully saved OAuth tokens and calendar ID', { 
      doctorId,
      calendarId,
      hasRefreshToken: !!updatedDoctor.googleRefreshToken,
      refreshTokenLength: updatedDoctor.googleRefreshToken?.length
    });

    return;
  } catch (error: any) {
    logger.error('Failed to save OAuth tokens', {
      doctorId,
      error: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });

    if (error.message.includes('Record to update not found')) {
      throw new Error(`Doctor with ID ${doctorId} not found in database`);
    }
    
    throw new Error(`Failed to save OAuth tokens for doctor ${doctorId}: ${error.message}`);
  }
}
