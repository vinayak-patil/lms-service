import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventService } from './event.service';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Global event emitter configuration
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
  ],
  providers: [EventService],
  exports: [EventService, EventEmitterModule],
})
export class EventsModule {} 