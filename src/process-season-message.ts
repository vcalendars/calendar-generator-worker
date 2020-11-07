import { Observable } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import Envelope from '@danielemeryau/simple-rabbitmq/dist/src/envelope';

import { MessageSerialisers } from '@teamest/models/helpers';
import { SerialisedChangedSeasonMessage } from '@teamest/models/messages';

import ICalendarUpdateMessage from './ICalendarUpdateMessage';
import UserService from './external/user.service';

export default function processSeasonMessage(userService: UserService) {
  return flatMap((envelope: Envelope<SerialisedChangedSeasonMessage>) => {
    return new Observable<ICalendarUpdateMessage>(observer => {
      const message = MessageSerialisers.deserialiseChangedSeasonMessage(envelope.message);
      const { teamName, seasonName, timeDetected } = message;
      userService
        .getUserIdsWithTeamSeason(teamName, seasonName)
        .then(usersWithTeamSeason => {
          let count = 0;
          const acknowledge = async () => {
            count += 1;
            if (count >= usersWithTeamSeason.length) {
              if (envelope.acknowledge) {
                await envelope.acknowledge();
              }
            }
          };
          usersWithTeamSeason.forEach(userId =>
            observer.next({
              acknowledge,
              userId,
              timeChangeDetected: timeDetected,
            }),
          );
        })
        .catch(err => {
          observer.error(err);
        });
    });
  });
}
