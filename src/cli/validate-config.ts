import { Configuration, CfgValidation } from '../configuration';

class Main {
  /* tslint:disable no-bitwise */
  public execute() {
    Configuration
      .loadConfiguration()
      .then( configuration => {
        configuration.validate();
        if (configuration.validationResult === CfgValidation.Ok) {
          console.info('\x1b[32m', 'Configuration is valid', '\x1b[0m');
        } else if (configuration.validationResult & CfgValidation.Fatal) {
          console.error('\x1b[31m', 'Configuration has fatal errors. The server will not start!', '\x1b[0m');
        } else if (configuration.validationResult & CfgValidation.Error) {
          console.error('\x1b[35m', 'Configuration has errors.', '\x1b[0m');
        } else if (configuration.validationResult & CfgValidation.Warning) {
          console.warn('\x1b[33m', 'Configuration has warnings', '\x1b[0m');
        } else {
          console.error('Configuration validation unknown');
        }
      });
  }
}

new Main().execute();
