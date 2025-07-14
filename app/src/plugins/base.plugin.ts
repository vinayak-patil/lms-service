import { EventEmitter2 } from '@nestjs/event-emitter';

export interface BasePlugin {
  name: string;
  version: string;
  description?: string;
  enabled: boolean;
  register(eventEmitter: EventEmitter2): void;
  unregister?(eventEmitter: EventEmitter2): void;
}

export interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];
  events?: string[];
}

export abstract class AbstractPlugin implements BasePlugin {
  abstract name: string;
  abstract version: string;
  abstract description?: string;
  enabled: boolean = true;

  abstract register(eventEmitter: EventEmitter2): void;

  unregister?(eventEmitter: EventEmitter2): void {
    // Default implementation - remove all listeners for this plugin
    eventEmitter.removeAllListeners();
  }

  protected log(message: string, ...args: any[]): void {
    console.log(`[${this.name}] ${message}`, ...args);
  }

  protected error(message: string, ...args: any[]): void {
    console.error(`[${this.name}] ERROR: ${message}`, ...args);
  }
} 