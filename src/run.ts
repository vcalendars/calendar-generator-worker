import { merge } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import Logger from '@danielemeryau/logger';
import { Rabbit, observeRabbit } from '@danielemeryau/simple-rabbitmq';

import { InternalSeasonServiceClient } from '@teamest/internal-season-client';
import {
  SerialisedChangedSeasonMessage,
  SerialisedChangedUserMessage,
} from '@teamest/models/messages';

import UserService from './external/user.service';
import processUserMessage from './process-user-message';
import processSeasonMessage from './process-season-message';
import processUpdate from './process-update';

async function initialise(logger: Logger) {
  const rabbit = new Rabbit(
    {
      host: process.env.RABBIT_MQ_HOST || 'localhost',
      port: process.env.RABBIT_MQ_PORT || '5672',
      user: process.env.RABBIT_MQ_USER || 'calendarworker',
      password: process.env.RABBIT_MQ_PASS || 'calendarworker',
    },
    logger,
  );
  await rabbit.connect();

  const INTERNAL_SEASON_API_URL = process.env.INTERNAL_SEASON_API_URL || 'http://localhost:9010';

  const userService = new UserService();
  const teamSeasonService = new InternalSeasonServiceClient(INTERNAL_SEASON_API_URL, 'calendar-generator-worker');

  return { rabbit, userService, teamSeasonService };
}

export default async function run(logger: Logger) {
  const { rabbit, userService, teamSeasonService } = await initialise(logger);
  logger.info('Initialisation Complete');
  try {
    const {
      observable: seasonObservable,
      cancel: seasonCancel,
    } = await observeRabbit<SerialisedChangedSeasonMessage>(
      rabbit,
      process.env.RABBIT_MQ_SEASON_EXCHANGE || 'changed_seasons',
      {
        queue:
          process.env.RABBIT_MQ_SEASON_QUEUE ||
          'calendar_generator_worker__changed_seasons',
        requiresAcknowledge: true,
      },
    );

    const {
      observable: userObservable,
      cancel: userCancel,
    } = await observeRabbit<SerialisedChangedUserMessage>(
      rabbit,
      process.env.RABBIT_MQ_USER_EXCHANGE || 'changed_users',
      {
        queue:
          process.env.RABBIT_MQ_USER_QUEUE ||
          'calendar_generator_worker__changed_users',
        requiresAcknowledge: true,
      },
    );

    const userUpdates = userObservable.pipe(processUserMessage(logger));
    const seasonUpdates = seasonObservable.pipe(
      processSeasonMessage(userService),
    );
    const updates = merge(userUpdates, seasonUpdates);

    await updates
      .pipe(
        processUpdate(userService, teamSeasonService, logger),
        flatMap(async update => {
          logger.info('Acknowledging');
          if (update.acknowledge) {
            await update.acknowledge();
            logger.info('Acknowledged');
          }
          return update;
        }),
      )
      .toPromise();
  } finally {
    await rabbit.disconnect();
  }
}
