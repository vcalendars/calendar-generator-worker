import { map } from 'rxjs/operators';
import { IEnvelope } from '@danielemeryau/simple-rabbitmq';
import Logger from '@danielemeryau/logger';

import { deserialiseCalendarRefreshMessage } from '@vcalendars/models/helpers';
import { SerialisedChangedUserMessage } from '@vcalendars/models/messages';

import ICalendarUpdateMessage from './ICalendarUpdateMessage';

export default function processUserMessage(logger: Logger) {
  return map((envelope: IEnvelope<SerialisedChangedUserMessage>) => {
    const message = deserialiseCalendarRefreshMessage(envelope.message);
    const { userId, timeChanged } = message;
    const result: ICalendarUpdateMessage = {
      acknowledge: envelope.acknowledge,
      userId,
      timeChangeDetected: timeChanged,
    };
    logger.info('Processed user message', result);
    return result;
  });
}
