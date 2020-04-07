import { IEventService} from '../services';
import { EventType } from '../objects/events';

export type ConsumerCallback = (event: any) => void;

export interface IConsumer {
  registerConsumers(): Array<[EventType, ConsumerCallback]>;
}
