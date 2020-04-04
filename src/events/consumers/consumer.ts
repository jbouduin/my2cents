import { IEventService} from '../../services';
import { EventType } from '..';

export type ConsumerCallback = (event: any) => void;

export interface IConsumer {
  registerConsumers(): Array<[EventType, ConsumerCallback]>;
}
