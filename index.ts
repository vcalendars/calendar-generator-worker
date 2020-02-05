import run from './src/run';
import Logger from '@danielemeryau/logger';

const logger = new Logger('calendar-generator-worker');

logger.info('Starting');
run(logger)
  .then(() => logger.info('Exited successfully'))
  .catch(err => {
    logger.error('Exited with error', err);
  });
