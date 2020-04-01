import { IEventService} from '../../services';

export type ConsumerCallback = (event: any) => void;

export interface IConsumer {
  registerConsumers(): Array<[EventType, ConsumerCallback]>;
}
