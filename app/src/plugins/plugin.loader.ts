import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs';
import * as path from 'path';
import { BasePlugin } from './base.plugin';

// Register ts-node for TypeScript file loading
if (process.env.NODE_ENV !== 'production') {
  require('ts-node/register');
}

@Injectable()
export class PluginLoader {
  private readonly logger = new Logger(PluginLoader.name);
  private loadedPlugins: Map<string, BasePlugin> = new Map();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Load all plugins from the installed plugins directory
   */
  async loadPlugins(): Promise<void> {
    const pluginDir = path.join(process.cwd(), 'src', 'plugins', 'installed');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(pluginDir)) {
      fs.mkdirSync(pluginDir, { recursive: true });
      this.logger.log(`Created plugins directory: ${pluginDir}`);
      return;
    }

    try {
      const pluginFiles = fs.readdirSync(pluginDir);
      const tsFiles = pluginFiles.filter(file => file.endsWith('.ts'));

      this.logger.log(`Found ${tsFiles.length} plugin files in ${pluginDir}`);

      for (const file of tsFiles) {
        await this.loadPlugin(path.join(pluginDir, file), file);
      }

      this.logger.log(`Successfully loaded ${this.loadedPlugins.size} plugins`);
    } catch (error) {
      this.logger.error(`Error loading plugins: ${error.message}`, error.stack);
    }
  }

  /**
   * Load a single plugin from file
   */
  private async loadPlugin(pluginPath: string, fileName: string): Promise<void> {
    try {
      // Use absolute path for import
      const absolutePath = path.resolve(pluginPath);
      this.logger.debug(`Loading plugin from: ${absolutePath}`);
      
      // Dynamic import of the plugin
      const pluginModule = await import(absolutePath);
      
      // Get the default export or the first export
      const PluginClass = pluginModule.default || Object.values(pluginModule)[0];
      
      if (!PluginClass) {
        this.logger.warn(`No plugin class found in ${fileName}`);
        return;
      }

      // Create plugin instance
      const pluginInstance: BasePlugin = new PluginClass();
      
      if (!pluginInstance.name) {
        this.logger.warn(`Plugin in ${fileName} does not have a name`);
        return;
      }

      // Check if plugin is enabled
      if (!pluginInstance.enabled) {
        this.logger.log(`Plugin ${pluginInstance.name} is disabled, skipping...`);
        return;
      }

      // Register the plugin
      pluginInstance.register(this.eventEmitter);
      
      // Store the plugin instance
      this.loadedPlugins.set(pluginInstance.name, pluginInstance);
      
      this.logger.log(`Plugin loaded: ${pluginInstance.name} v${pluginInstance.version}`);
    } catch (error) {
      this.logger.error(`Error loading plugin ${fileName}: ${error.message}`, error.stack);
    }
  }

  /**
   * Get all loaded plugins
   */
  getLoadedPlugins(): Map<string, BasePlugin> {
    return this.loadedPlugins;
  }

  /**
   * Get a specific plugin by name
   */
  getPlugin(name: string): BasePlugin | undefined {
    return this.loadedPlugins.get(name);
  }

  /**
   * Unload a plugin
   */
  unloadPlugin(name: string): boolean {
    const plugin = this.loadedPlugins.get(name);
    if (plugin && plugin.unregister) {
      plugin.unregister(this.eventEmitter);
      this.loadedPlugins.delete(name);
      this.logger.log(`Plugin unloaded: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * Unload all plugins
   */
  unloadAllPlugins(): void {
    for (const [name, plugin] of this.loadedPlugins) {
      if (plugin.unregister) {
        plugin.unregister(this.eventEmitter);
      }
    }
    this.loadedPlugins.clear();
    this.logger.log('All plugins unloaded');
  }
} 