import { map } from 'rxjs/operators';
import { IEnvelope } from '@danielemeryau/simple-rabbitmq';
import Logger from '@danielemeryau/logger';

import { MessageSerialisers } from '@teamest/models/helpers';
import { SerialisedChangedUserMessage } from '@teamest/models/messages';

import ICalendarUpdateMessage from './ICalendarUpdateMessage';

export default function processUserMessage(logger: Logger) {
  return map((envelope: IEnvelope<SerialisedChangedUserMessage>) => {
    const message = MessageSerialisers.deserialiseChangedUserMessage(
      envelope.message,
    );
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
