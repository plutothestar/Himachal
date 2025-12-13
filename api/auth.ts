import { OAuth2Client } from 'google-auth-library';
// import { google } from 'googleapis';
import { db } from './fireBaseInit';
import { doc, setDoc } from 'firebase/firestore';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    if (req.method === 'GET') {
        const oAuth2Client = new OAuth2Client(
            CLIENT_ID,
            CLIENT_SECRET,
            REDIRECT_URI
        );

        if (req.query.code) {
            try {
                const { tokens } = await oAuth2Client.getToken(req.query.code);
                oAuth2Client.setCredentials(tokens);

                console.log('Access token:', tokens.access_token);
                console.log('Refresh token:', tokens.refresh_token);
                if (tokens.refresh_token) {
                    const tokenRef = doc(db, 'serviceAccounts', 'googleCalendar');
                    await setDoc(tokenRef, { refresh_token: tokens.refresh_token }, { merge: true });
                    console.log('Refresh token stored in Firestore.');

                    res.send(`
                        <html>
                            <head>
                                <script>
                                    window.close();
                                </script>
                            </head>
                            <body>
                                <p>Authorization successful. You can close this window now.</p>
                            </body>
                        </html>
                    `);
                }
            } catch (error) {
                console.error('Error exchanging authorization code for tokens:', error);
                res.status(500).json({ error: 'Failed to exchange authorization code for tokens' });
            }
        } else {
            const authUrl = oAuth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: SCOPES,
                prompt: 'consent',
            });
            console.log('Authorize this app by visiting this url:', authUrl);
            res.status(200).json({ authUrl });
        }

    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
};
