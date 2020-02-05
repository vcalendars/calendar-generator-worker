import Knex from 'knex';
import { merge } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import Logger from '@danielemeryau/logger';
import { Rabbit, observeRabbit } from '@danielemeryau/simple-rabbitmq';

import {
  SerialisedChangedSeasonMessage,
  SerialisedChangedUserMessage,
} from '@vcalendars/models/messages';

import UserService from './external/user.service';
import TeamSeasonService from './external/team_season.service';
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
  const knex = Knex({
    client: 'mysql2',
    connection: {
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'dataworker',
      password: process.env.MYSQL_PASS || 'dataworker',
      database: process.env.MYSQL_DATABASE || 'season_data',
    },
    migrations: {
      tableName: 'migrations',
    },
  });

  await rabbit.connect();

  const userService = new UserService(knex);
  const teamSeasonService = new TeamSeasonService(knex);

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
