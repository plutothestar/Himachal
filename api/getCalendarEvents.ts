import { google } from 'googleapis';
import { db } from './fireBaseInit';
import { doc, getDoc } from 'firebase/firestore';
import qs from 'qs';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

// Fetch refresh token from Firestore
async function getRefreshToken() {
    const tokenRef = doc(db, 'serviceAccounts', 'googleCalendar');
    const tokenDoc = await getDoc(tokenRef);

    if (tokenDoc.exists()) {
        return tokenDoc.data().refresh_token;
    } else {
        throw new Error('Refresh token not found in Firestore');
    }
}

// Get access token from Google
async function getAccessToken(refreshToken: string): Promise<string> {
    try {
        const body = qs.stringify({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
        });

        const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

        const response = await axios.post(TOKEN_URL, body, { headers });
        return response.data.access_token;
    } catch (error) {
        console.error("Error refreshing access token:", error);
        throw new Error("Failed to refresh access token");
    }
}

// Fetch Calendar Events
async function getCalendarEvents(timeMin: string, timeMax: string, CALENDAR_ID: string) {
    try {
        const refreshToken = await getRefreshToken();
        const accessToken = await getAccessToken(refreshToken);

        const oAuth2Client = new OAuth2Client({
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            redirectUri: REDIRECT_URI,
        });
        oAuth2Client.setCredentials({ access_token: accessToken });

        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

        const events = await calendar.events.list({
            calendarId: CALENDAR_ID ?? 'primary',
            timeMin: timeMin,
            timeMax: timeMax,
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        });

        return events.data.items || [];
    } catch (error) {
        console.error("Error fetching calendar events:", error);
        throw new Error("Failed to fetch calendar events");
    }
}


async function addCalendarEvent(eventData: any, CALENDAR_ID: string) {
    try {
      const refreshToken = await getRefreshToken();
      const accessToken = await getAccessToken(refreshToken);

      const oAuth2Client = new OAuth2Client({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        redirectUri: REDIRECT_URI,
      });
      oAuth2Client.setCredentials({ access_token: accessToken });

      const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
      const event = {
        summary: eventData.summary,
        location: eventData.location || '',
        description: eventData.description || '',
        start: eventData.start,
        end:  eventData.end,
        attendees: eventData.attendees || [],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 }
          ]
        },
        conferenceData: eventData.conferenceData,
      };

      const response = await calendar.events.insert({
        calendarId: CALENDAR_ID ?? 'primary',
        requestBody: event,
        conferenceDataVersion: eventData.conferenceDataVersion,
        sendUpdates: eventData.sendUpdates
      });

      return response.data;
    } catch (error) {
      console.error("Error adding calendar event:", error);
      throw new Error("Failed to add calendar event");
    }
  }



// API Handler to Support Both GET (Fetch Events) and POST (Add Event)
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    try {
        if (req.method === 'GET') {
            const { timeMin, timeMax, CALENDAR_ID } = req.query;

            if (!timeMin || !timeMax || !CALENDAR_ID) {
                return res.status(400).json({ error: 'timeMin, timeMax, and CALENDAR_ID are required' });
            }

            const events = await getCalendarEvents(timeMin, timeMax, CALENDAR_ID);
            return res.status(200).json({ events });

        } else if (req.method === 'POST') {
            try {
                const { summary, location, description, start, end, attendees, CALENDAR_ID, conferenceData, conferenceDataVersion, sendUpdates } = req.body;

                if (!summary || !start || !end || !CALENDAR_ID) {
                    return res.status(400).json({ error: 'summary, startTime, endTime, and CALENDAR_ID are required' });
                }

                const eventData = {
                    summary,
                    location: location || '',
                    description: description || '',
                    start,
                    end,
                    attendees: attendees || [],
                    conferenceData: conferenceData || undefined,
                    conferenceDataVersion: conferenceDataVersion || 1,
                    sendUpdates: sendUpdates || 'none'
                };

                const event = await addCalendarEvent(eventData, CALENDAR_ID);
                return res.status(200).json({ event });

            } catch (error) {
                console.error("Error processing POST request:", error);
                return res.status(500).json({ error: "Internal Server Error" });
            }
        }


        res.status(405).json({ error: 'Method Not Allowed' });

    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: error.message });
    }
};
