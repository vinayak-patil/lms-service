import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PluginLoader } from './plugin.loader';
import { BasePlugin } from './base.plugin';
import { ApiId } from '../common/decorators/api-id.decorator';
import { TenantOrg } from '../common/decorators/tenant-org.decorator';

@ApiTags('Plugins')
@Controller('plugins')
@ApiBearerAuth()
export class PluginsController {
  constructor(private readonly pluginLoader: PluginLoader) {}

  @Get()
  @ApiOperation({ summary: 'Get all loaded plugins' })
  @ApiResponse({ status: 200, description: 'List of loaded plugins' })
  @ApiId('GET_PLUGINS')
  async getPlugins(
    @TenantOrg() tenantOrg: { tenantId: string; organisationId: string }
  ): Promise<{ plugins: Array<{ name: string; version: string; description?: string; enabled: boolean }> }> {
    const loadedPlugins = this.pluginLoader.getLoadedPlugins();
    const plugins = Array.from(loadedPlugins.values()).map(plugin => ({
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      enabled: plugin.enabled,
    }));

    return { plugins };
  }

  @Get(':name')
  @ApiOperation({ summary: 'Get plugin details by name' })
  @ApiResponse({ status: 200, description: 'Plugin details' })
  @ApiResponse({ status: 404, description: 'Plugin not found' })
  @ApiId('GET_PLUGIN')
  async getPlugin(
    @Param('name') name: string,
    @TenantOrg() tenantOrg: { tenantId: string; organisationId: string }
  ): Promise<{ name: string; version: string; description?: string; enabled: boolean }> {
    const plugin = this.pluginLoader.getPlugin(name);
    if (!plugin) {
      throw new Error('Plugin not found');
    }

    return {
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      enabled: plugin.enabled,
    };
  }

  @Delete(':name')
  @ApiOperation({ summary: 'Unload a plugin' })
  @ApiResponse({ status: 200, description: 'Plugin unloaded successfully' })
  @ApiResponse({ status: 404, description: 'Plugin not found' })
  @ApiId('UNLOAD_PLUGIN')
  async unloadPlugin(
    @Param('name') name: string,
    @TenantOrg() tenantOrg: { tenantId: string; organisationId: string }
  ): Promise<{ success: boolean; message: string }> {
    const success = this.pluginLoader.unloadPlugin(name);
    if (!success) {
      throw new Error('Plugin not found or could not be unloaded');
    }

    return {
      success: true,
      message: `Plugin ${name} unloaded successfully`,
    };
  }

  @Post('reload')
  @ApiOperation({ summary: 'Reload all plugins' })
  @ApiResponse({ status: 200, description: 'Plugins reloaded successfully' })
  @ApiId('RELOAD_PLUGINS')
  async reloadPlugins(
    @TenantOrg() tenantOrg: { tenantId: string; organisationId: string }
  ): Promise<{ success: boolean; message: string; loadedCount: number }> {
    // Unload all existing plugins
    this.pluginLoader.unloadAllPlugins();

    // Load all plugins again
    await this.pluginLoader.loadPlugins();

    const loadedPlugins = this.pluginLoader.getLoadedPlugins();

    return {
      success: true,
      message: 'Plugins reloaded successfully',
      loadedCount: loadedPlugins.size,
    };
  }
} 