/* eslint-disable no-console */
import { EventTarget } from 'event-target-shim';
import Log from './Log';

export enum LOG_PROXY_TYPE {
  DEBUG = 'D',
  LOG = 'L',
  WARN = 'W',
  ERROR = 'E',
  UNCAUGHT_ERROR = 'U',
}

export class LogProxy {
  private isEnabled = false;

  private debug: (...data: unknown[]) => void;

  private log: (...data: unknown[]) => void;

  private warn: (...data: unknown[]) => void;

  private error: (...data: unknown[]) => void;

  private eventTarget: EventTarget;

  private handleUncaughtError = (event: ErrorEvent) => {
    const messages: string[] = [];
    if (event.error) {
      messages.push(event.error as string);
    }
    if (event.message) {
      messages.push(event.message);
    }
    this.eventTarget.dispatchEvent(
      new CustomEvent(LOG_PROXY_TYPE.UNCAUGHT_ERROR, {
        detail: messages,
      })
    );
  };

  constructor() {
    this.debug = console.debug;
    this.log = console.log;
    this.warn = console.warn;
    this.error = console.error;
    this.eventTarget = new EventTarget();
  }

  enable(): void {
    if (this.isEnabled) {
      return;
    }

    console.debug = (...args: unknown[]): void => {
      this.eventTarget.dispatchEvent(
        new CustomEvent(LOG_PROXY_TYPE.DEBUG, { detail: args })
      );
      this.debug.apply(console, args);
    };

    console.log = (...args: unknown[]): void => {
      this.eventTarget.dispatchEvent(
        new CustomEvent(LOG_PROXY_TYPE.LOG, { detail: args })
      );
      this.log.apply(console, args);
    };

    console.warn = (...args: unknown[]): void => {
      this.eventTarget.dispatchEvent(
        new CustomEvent(LOG_PROXY_TYPE.WARN, { detail: args })
      );
      this.warn.apply(console, args);
    };

    console.error = (...args: unknown[]): void => {
      this.eventTarget.dispatchEvent(
        new CustomEvent(LOG_PROXY_TYPE.ERROR, { detail: args })
      );
      this.error.apply(console, args);
    };

    window.addEventListener('error', this.handleUncaughtError);

    // This forces logger to update its reference to the overriding functions instead of the original
    Log.setLogLevel(Log.level);
    this.isEnabled = true;
  }

  disable(): void {
    if (!this.isEnabled) {
      return;
    }
    console.debug = this.debug;
    console.log = this.log;
    console.warn = this.warn;
    console.error = this.error;
    window.removeEventListener('error', this.handleUncaughtError);
    Log.setLogLevel(Log.level);
    this.isEnabled = false;
  }

  addEventListener(
    type: LOG_PROXY_TYPE,
    listener: (event: CustomEvent<unknown[]>) => void
  ): void {
    // The cast as EventListener is a dumb TypeScript issue
    this.eventTarget.addEventListener(type, listener as EventListener);
  }

  removeEventListener(
    type: LOG_PROXY_TYPE,
    listener: (event: CustomEvent<unknown[]>) => void
  ): void {
    this.eventTarget.removeEventListener(type, listener as EventListener);
  }
}

export default LogProxy;
