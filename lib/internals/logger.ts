import { createLogger } from 'sat-utils';

const { PROMOD_LOG_LEVEL } = process.env;

const promodLogger = createLogger().addCustomLevel(
  'engineLog',
  'PROMOD_ENGINE',
  'PROMOD_ENGINE',
  'info',
  'FgWhite',
  'Blink',
);

promodLogger.setLogLevel(PROMOD_LOG_LEVEL);

export { promodLogger };
