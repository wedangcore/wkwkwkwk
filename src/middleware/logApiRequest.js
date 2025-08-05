// src/middleware/logApiRequest.js
import User from '@/models/user'; // Pastikan path benar

const logApiRequest = async (req, res, next) => {
  const { method, url, body } = req;
  const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  console.log(`[LOG MIDDLEWARE] Request: ${method} ${url} from ${ipAddress}`);

  // Simpan log ke database jika diperlukan
  // ...

  next();
};

export default logApiRequest;
