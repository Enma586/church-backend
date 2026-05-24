import { google } from 'googleapis';
import fs from 'fs';
import { AppError } from '../../utils/AppError.js';

/**
 * Sube un archivo a Google Drive usando OAuth 2.0 de usuario
 * (las service accounts no tienen cuota de almacenamiento).
 */
export const uploadToGoogleDrive = async (filePath, fileName) => {
  const folderId = process.env.GOOGLE_DRIVE_ID;

  if (!folderId) {
    throw new AppError('GOOGLE_DRIVE_ID no configurado en variables de entorno', 500);
  }

  if (!fs.existsSync(filePath)) {
    throw new AppError(`Archivo no encontrado: ${filePath}`, 500);
  }

  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new AppError('GOOGLE_REFRESH_TOKEN no configurado — necesario para Drive', 500);
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    'http://localhost'
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType: 'application/zip',
    body: fs.createReadStream(filePath),
  };

  console.log(`[GoogleDrive] Subiendo "${fileName}" a Drive...`);
  const startTime = Date.now();

  const { data } = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, name, webViewLink',
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `[GoogleDrive] ✅ Subido: ${data.name} (${duration}s)\n` +
    `   ID: ${data.id}\n` +
    `   Link: ${data.webViewLink}`
  );

  return data;
};