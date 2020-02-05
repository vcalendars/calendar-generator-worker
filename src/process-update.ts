import { flatMap } from 'rxjs/operators';
import Logger from '@danielemeryau/logger';

import { generateCalendarFromArray } from '@vcalendars/calendar-generator';

import UserService from './external/user.service';
import TeamSeasonService from './external/team_season.service';
import ICalendarUpdateMessage from './ICalendarUpdateMessage';

export default function ProcessUpdate(
  userService: UserService,
  teamSeasonService: TeamSeasonService,
  logger: Logger,
) {
  return flatMap(async (message: ICalendarUpdateMessage) => {
    logger.info('Processing Message');

    const userTeamSeasons = await userService.getUserTeamSeasons(
      message.userId,
    );
    const teamSeasons = await teamSeasonService.getTeamSeasons(userTeamSeasons);

    logger.info('Processed Message', teamSeasons);

    return message;
  });
}
