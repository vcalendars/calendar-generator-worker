import { flatMap } from 'rxjs/operators';
import Logger from '@danielemeryau/logger';

import { generateCalendarFromArray } from '@teamest/calendar-generator';
import { InternalSeasonServiceClient } from '@teamest/internal-season-client';

import UserService from './external/user.service';
import ICalendarUpdateMessage from './ICalendarUpdateMessage';
import s3Service from './s3-service';

export default function ProcessUpdate(
  userService: UserService,
  teamSeasonService: InternalSeasonServiceClient,
  logger: Logger,
) {
  return flatMap(async (message: ICalendarUpdateMessage) => {
    logger.info('Processing Message');
    const { userId, timeChangeDetected } = message;

    const userTeamSeasons = await userService.getUserTeamSeasons(userId);
    
    const teamSeasons = await teamSeasonService.GetSeasonsForTeam({
      teamSpecifiers: userTeamSeasons,
    });

    const calendar = await generateCalendarFromArray(teamSeasons.matchingTeamSeasons, {
      domain: 'vcalendars.demery.com.au',
      name: 'VCalendars',
      timezone: 'Australia/Adelaide',
      created: timeChangeDetected,
    });

    logger.info('Processed Message', calendar);

    await s3Service.uploadToS3(`${userId}.ical`, calendar);

    return message;
  });
}
