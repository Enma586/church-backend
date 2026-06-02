/**
 * @fileoverview Controller for Docker image updates via Docker socket.
 * No requiere Docker CLI ni paquetes extra — usa el socket de Docker directamente.
 */
import http from 'http';

const SOCKET = '/var/run/docker.sock';
const IMAGE = 'enma21025/backend';
const TAG = 'latest';

/**
 * Hace una request al socket de Docker.
 */
function dockerRequest(method, path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { socketPath: SOCKET, method, path, timeout: 120000 },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body }));
      },
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout al contactar el socket de Docker'));
    });
    req.end();
  });
}

export const triggerSystemUpdate = async (req, res, next) => {
  try {
    // 1. Hacer pull de la nueva imagen
    const encodedImage = encodeURIComponent(`${IMAGE}:${TAG}`);
    const pullResult = await dockerRequest(
      'POST',
      `/images/create?fromImage=${encodedImage}`,
    );

    if (pullResult.status !== 200) {
      // Si falló, ver si el socket está montado
      throw new Error(
        `Docker pull falló (${pullResult.status}): ${pullResult.body}`,
      );
    }

    // 2. Intentar notificar a Watchtower para que reinicie
    try {
      const wtReq = http.request(
        { hostname: 'watchtower', port: 8080, path: '/v1/update', method: 'GET', timeout: 3000 },
        (wtRes) => {
          let body = '';
          wtRes.on('data', (chunk) => (body += chunk));
          wtRes.on('end', () => {
            console.log(`[SystemUpdate] Watchtower responded: ${wtRes.statusCode}`);
          });
        },
      );
      wtReq.on('error', () => console.log('[SystemUpdate] Watchtower no disponible — reinicio automático en 5 min'));
      wtReq.on('timeout', () => {
        wtReq.destroy();
        console.log('[SystemUpdate] Watchtower timeout — reinicio automático en 5 min');
      });
      wtReq.end();
    } catch { /* ignore */ }

    res.status(200).json({
      success: true,
      message:
        'Imagen descargada exitosamente. Watchtower reiniciará el sistema automáticamente en los próximos minutos.',
    });
  } catch (err) {
    if (err.message?.includes('connect ECONNREFUSED') || err.message?.includes('ENOENT')) {
      return res.status(500).json({
        success: false,
        message:
          'El socket de Docker no está disponible. Verifica que el volumen /var/run/docker.sock esté montado en el contenedor del backend.',
      });
    }
    next(err);
  }
};
