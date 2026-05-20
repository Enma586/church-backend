import { google } from 'googleapis';
import fs from 'fs';
import { AppError } from '../../utils/AppError.js';

/**
 * Sube un archivo a una carpeta específica de Google Drive
 * usando la cuenta de servicio configurada en las variables de entorno.
 *
 * @param {string} filePath - Ruta absoluta del archivo a subir
 * @param {string} fileName - Nombre con el que se guardará en Drive
 * @returns {Promise<{ id: string, name: string, webViewLink: string }>}
 */
export const uploadToGoogleDrive = async (filePath, fileName) => {
  const folderId = process.env.GOOGLE_DRIVE_ID;

  if (!folderId) {
    throw new AppError(
      'GOOGLE_DRIVE_ID no está configurado en las variables de entorno',
      500
    );
  }

  // Validar que el archivo existe
  if (!fs.existsSync(filePath)) {
    throw new AppError(`Archivo no encontrado: ${filePath}`, 500);
  }

  const privateKey = process.env.GOOGLE_PRIVATE_KEY
    ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  // Cliente autenticado con la cuenta de servicio
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  const drive = google.drive({ version: 'v3', auth });

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
    `[GoogleDrive] Archivo subido: ${data.name} (${duration}s)\n` +
    `   ID: ${data.id}\n` +
    `   Link: ${data.webViewLink}`
  );

  return data;
};