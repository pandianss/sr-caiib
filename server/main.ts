/** Server entry point. `npm run server` (development) or APP_MODE=production with the documented environment. */
import { ConfigError, loadConfig, paymentEnvironment } from './config.ts';
import { createApp } from './app.ts';

try {
  const config = loadConfig();
  const app = createApp({ config });
  const port = await app.listen();
  const env = paymentEnvironment(config);
  console.log(`CAIIB API listening on http://localhost:${port} (mode=${config.mode}, payments=${env ?? 'disabled'})`);
  if (env === 'local_simulation') console.log('Payments are a LOCAL SIMULATION. No real provider is contacted and no money can move.');
  if (env === 'razorpay_test') console.log('Payments use Razorpay TEST keys.');
  const stop = () => { void app.close().then(() => process.exit(0)); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
} catch (e) {
  if (e instanceof ConfigError) { console.error(`Configuration error: ${e.message}`); process.exit(2); }
  throw e;
}
