/**
 * Production entry point.
 *
 * Hostinger's "Node.js app" manager (Passenger) needs a startup file — set the
 * Application startup file to `server.js` in hPanel. On a VPS you can run this
 * with `node server.js` (or `pm2 start server.js --name content-os`), or simply
 * use `npm start` (`next start`) instead.
 *
 * Requires a production build first: `npm run build`.
 */
const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOST || "0.0.0.0";

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Content OS ready on http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Failed to start Content OS:", err);
    process.exit(1);
  });
