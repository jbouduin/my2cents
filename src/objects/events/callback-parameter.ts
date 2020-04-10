import { IPushConsumer, ISendMailConsumer, ISlackConsumer, IWriteLogConsumer } from '../../consumers';
import { IConfigurationService } from '../../services';

export class CallbackParameter<T> {
  // constructor
  public constructor(public pushConsumer: IPushConsumer,
    public sendMailConsumer: ISendMailConsumer,
    public slackConsumer: ISlackConsumer,
    public writeLogConsumer: IWriteLogConsumer,
    public configurationService: IConfigurationService,
    public data: T) { }
}
