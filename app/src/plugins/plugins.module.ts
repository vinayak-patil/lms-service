import { Module, OnModuleInit } from '@nestjs/common';
import { PluginLoader } from './plugin.loader';
import { PluginsController } from './plugins.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    EventsModule,
  ],
  controllers: [PluginsController],
  providers: [PluginLoader],
  exports: [PluginLoader],
})
export class PluginsModule implements OnModuleInit {
  constructor(private readonly pluginLoader: PluginLoader) {}

  async onModuleInit() {
    // Load all plugins when the module initializes
    await this.pluginLoader.loadPlugins();
  }
} 