import { Application, Router } from 'express';
import { inject, injectable } from 'inversify';
import * as passport from 'passport';
import * as facebook from 'passport-facebook';
import * as github from 'passport-github2';
import * as google from 'passport-google-oauth';
import * as instagram from 'passport-instagram';
import * as linkedin from 'passport-linkedin';
import * as passportLocal from 'passport-local';
import * as twitter from 'passport-twitter';
import 'reflect-metadata';

import { Authentication, Provider, ProviderName } from '../configuration';
import SERVICETYPES from './service.types';

import { IConfigurationService} from './configuration.service';
import { IService } from './service';
import { IUserService } from './user.service';

const LocalStrategy = passportLocal.Strategy;

export interface IProvider {
  id: string;
  name: string;
}

export interface IAuthenticationService extends IService {
  getProviders(): Array<IProvider>;
}

@injectable()
export class AuthenticationService implements IAuthenticationService {

  // fields
  private providers = new Array<IProvider>();
  private successPath: string;

  // constructor
  public constructor(
    @inject(SERVICETYPES.ConfigurationService) private configurationService: IConfigurationService,
    @inject(SERVICETYPES.UserService) private userService: IUserService) { }

  // interface members
  public async initialize(app: Application): Promise<any> {
    this.initializePassport(app);
    this.successPath = `${this.configurationService.environment.server.pathToMy2Cents}/auth/success`;
    return Promise.resolve(this.providers);
  }

  public getProviders(): Array<IProvider> {
    return this.providers;
  }

  // private methods
  private buildCallBackUrl(authorizer: string) {
    return `${this.configurationService.environment.server.protocol}/auth/${authorizer}/callback`;
  }

  private initializePassport(app: Application) {

    app.use(passport.initialize());
    app.use(passport.session());
    const router = Router();

    passport.serializeUser((user: any, done: any) => {
      console.debug(`Serialize user: ${user.id}@${user.provider}`);
      this.userService
        .findUser(user.provider, user.id)
        .then(row => {
          if (row) {
            return done(null, row); // welcome back
          }
          // create a new user
          this.userService.createUser(
            user.provider,
            user.id,
            user.displayName,
            user.username || user.displayName,
            user.profileUrl || ''
          )
          .then(created => {
            this.userService
              .findUser(user.provider, user.id)
              .then(newRow => {
                if (newRow) {
                  return done(null, newRow); // welcome new user
                }
                console.error('no user found after insert');
              })
              .catch(err => console.error('could not find user', err));
            })
          .catch(err => console.error('could not create user', err));
        })
        .catch(err => console.error('could not find user', err));
    });

    passport.deserializeUser((user: any, done: any) => {
      console.debug(`Deserialize user: ${user.provider_id}@${user.provider}`);
      done(null, { id: user.provider_id, provider: user.provider });
    });

    router.get('/signout', (request, reply) => {
      request.logout();
      reply.send({ status: 'ok' });
    });

    router.get('/success', (request, reply) => {
        reply.send(`<!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <title>Anonymous access</title>
            <script>
                window.opener.__my2cents_wait_for_oauth();
            </script>
          </head>
          <body>
            <h1>OK</h1>
          </body>
        </html>`);
    });

    if (this.configurationService.environment.authentication.allowAnonymous  ||
      this.configurationService.environment.authentication.allowLocal) {

      if (this.configurationService.environment.authentication.allowAnonymous) {
        console.warn('allowing anonymous access. I hope this is not a production environment!');
      }

      if (this.configurationService.environment.authentication.allowLocal &&
        this.configurationService.getNodeEnvironment() !== 'development') {
          console.error('This is not a development environment! Not allowing user/password for access');
      }

      this.initializeLocal(
        router,
        this.configurationService.environment.authentication.allowAnonymous,
        this.configurationService.environment.authentication.allowLocal &&
          this.configurationService.getNodeEnvironment() === 'development'
      );
    }

    this.configurationService.environment.authentication.providers
    .filter(provider => provider.id && provider.secret)
    .forEach(provider => {
      switch (provider.name) {
        case ProviderName.TWITTER: {
          this.initializeTwitter(router, provider);
          break;
        }
        case ProviderName.GITHUB: {
          this.initializeGitHub(router, provider);
          break;
        }
        case ProviderName.GOOGLE: {
          this.initializeGoogle(router, provider);
          break;
        }
        case ProviderName.FACEBOOK: {
          this.initializeFacebook(router, provider);
          break;
        }
        case ProviderName.LINKEDIN: {
          this.initializeLinkedIn(router, provider);
          break;
        }
        case ProviderName.INSTAGRAM: {
          this.initializeInstagram(router, provider);
          break;
        }
        default: console.warn(`Non supported authentication provider found in the configuration: '${provider.name}'`);
      }
    });

    app.use('/auth', router);
  }

  private initializeLocal(router: Router, allowAnonymous: boolean, allowLocal: boolean): void {

    this.providers.push({
      id: 'local',
      name: allowLocal ? 'Local and Anonymous' : 'Anonymous'
    });

    passport.use(new LocalStrategy(
        (user, password, done) => {
          if (user.toLowerCase() === 'anonymous' && this.configurationService.environment.authentication.allowAnonymous) {
            return done(null, { id: 'anonymous', provider: 'local' });
          } else {
            this.userService.findUser('local', user.toLowerCase())
              .then(found => {
                if (found && !found.blocked && password.toLowerCase() === found.local_password.toLowerCase()) {
                  return done(null, { id: found.provider_id, provider: 'local' });
                } else {
                  return done(null, false, { message: 'Incorrect credentials.' });
                }
              });
          }
        }
      )
    );

    router.get(
      '/local',
      (request, reply) => {
        reply.send(`
          <!doctype html>

          <html lang="en">
            <head>
              <meta charset="utf-8">
              <title>Anonymous access</title>
            </head>

            <body>
              <center>
                <h1>Do not use local login in production environment!</h1>

                <div style="{border: 2px;}">
                  <form action="/my2cents/auth/anonymous" method="post">
                    <input type="hidden" name="username" value ="Anonymous">
                    <input type="hidden" name="password" value ="x">
                    <input type="submit" value="Anonymously comment">
                  </form>
                <div>
                <br>
                <div style="{border: 2px;}">
                  <form action="/my2cents/auth/local" method="post" >
                    <p>User: <input name="username" placeholder="enter username"></p>
                    <p>Password: <input name="password" placeholder="enter password"></p>
                    <input type="submit" value="Login">
                  </form>
                <div>
              </center>
            </body>
          </html>
          `
        );
      }
    );

    router.post(
      '/anonymous',
      passport.authenticate('local', { session: true}),
      (request, reply, next) => {
        reply.redirect(this.successPath);
      }
    );

    router.post(
      '/local',
      passport.authenticate('local', { session: true}),
      (request, reply, next) => {
        reply.redirect(this.successPath);
      }
    );

  }

  private initializeTwitter(router: Router, provider: Provider): void {
    this.providers.push({ id: 'twitter', name: 'Twitter' });
    passport.use(
      new twitter.Strategy(
        {
          callbackURL: this.buildCallBackUrl('twitter'),
          consumerKey: provider.id,
          consumerSecret: provider.secret
        },
        (token, tokenSecret, profile, done) => { done(null, profile); }
      )
    );

    router.get('/twitter', passport.authenticate('twitter'));

    router.get(
      '/twitter/callback',
      passport.authenticate('twitter', { failureRedirect: '/login' }),
      (request, reply) => { reply.redirect(this.successPath); }
    );
  }

  private initializeGitHub(router: Router, provider: Provider): void {
    this.providers.push({ id: 'github', name: 'Github' });
    passport.use(
      new github.Strategy(
        {
          callbackURL: this.buildCallBackUrl('github'),
          clientID: provider.id,
          clientSecret: provider.secret
        },
        (accessToken, refreshToken, profile, done) => { done(null, profile); }
      )
    );

    router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

    router.get(
      '/github/callback',
      passport.authenticate('github', { failureRedirect: '/login' }),
      (request, reply) => { reply.redirect(this.successPath); }
    );
  }

  private initializeGoogle(router: Router, provider: Provider): void {
    this.providers.push({ id: 'google', name: 'Google' });
    passport.use(
      new google.Strategy(
        {
          callbackURL: this.buildCallBackUrl('google'),
          consumerKey: provider.id,
          consumerSecret: provider.secret
        },
        (accessToken, refreshToken, profile, done) => { done(null, profile); }
      )
    );

    router.get(
      '/google',
      passport.authenticate('google', {
        scope: ['https://www.google.com/m8/feeds']
      })
    );

    router.get(
        '/google/callback',
        passport.authenticate('google', { failureRedirect: '/login' }),
        (request, reply) => { reply.redirect(this.successPath); }
    );
  }

  private initializeFacebook(router: Router, provider: Provider): void {
    this.providers.push({ id: 'facebook', name: 'Facebook' });
    passport.use(
      new facebook.Strategy(
        {
          callbackURL: this.buildCallBackUrl('facebook'),
          clientID: provider.id,
          clientSecret: provider.secret
        },
        (accessToken, refreshToken, profile, done) => { done(null, profile); }
      )
    );

    router.get('/facebook', passport.authenticate('facebook'));

    router.get(
        '/facebook/callback',
        passport.authenticate('facebook', { failureRedirect: '/login' }),
        (request, reply) => { reply.redirect(this.successPath); }
    );
  }

  private initializeInstagram(router: Router, provider: Provider): void {
    this.providers.push({ id: 'instagram', name: 'Instagram' });
    passport.use(
      new instagram.Strategy(
        {
          callbackURL: this.buildCallBackUrl('instagram'),
          clientID: provider.id,
          clientSecret: provider.secret
        },
        (accessToken, refreshToken, profile, done) => { done(null, profile); }
      )
    );

    router.get('/instagram', passport.authenticate('instagram'));

    router.get(
        '/instagram/callback',
        passport.authenticate('instagram', { failureRedirect: '/login' }),
        (request, reply) => { reply.redirect(this.successPath); }
    );
  }

  private initializeLinkedIn(router: Router, provider: Provider): void {
    this.providers.push({ id: 'linkedin', name: 'LinkedIn' });
    passport.use(
      new linkedin.Strategy(
        {
          callbackURL: this.buildCallBackUrl('linkedin'),
          consumerKey: provider.id,
          consumerSecret: provider.secret
        },
        (accessToken, refreshToken, profile, done) => { done(null, profile); }
      )
    );

    router.get('/linkedin', passport.authenticate('linkedin'));

    router.get(
        '/linkedin/callback',
        passport.authenticate('linkedin', { failureRedirect: '/linkedin' }),
        (request, reply) => { reply.redirect(this.successPath); }
    );
  }
}
