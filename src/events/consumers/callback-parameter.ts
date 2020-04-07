import { IPushConsumer, ISendMailConsumer, ISlackConsumer, IWriteLogConsumer } from './';

export class CallbackParameter<T> {
  // constructor
  public constructor(public pushConsumer: IPushConsumer,
    public sendMailConsumer: ISendMailConsumer,
    public slackConsumer: ISlackConsumer,
    public writeLogConsumer: IWriteLogConsumer,
    public data: T) { }
}
