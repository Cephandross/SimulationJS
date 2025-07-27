// src/persistence/SupabaseGameState.js
import { createClient } from '@supabase/supabase-js';

class SupabaseGameState {
  constructor() {
    // You'll get these from your Supabase dashboard
    this.supabase = createClient(
      'YOUR_SUPABASE_URL',
      'YOUR_SUPABASE_ANON_KEY'
    );
    
    this.currentWorldId = null;
    this.subscription = null;
  }

  // Create a new world
  async createWorld(name, seed = null) {
    const worldData = {
      name,
      seed: seed || Math.floor(Math.random() * 1000000),
      tick_count: 0,
      world_data: { 
        generation_params: {
          radius: 125,
          biome_settings: {}
        }
      }
    };

    const { data, error } = await this.supabase
      .from('worlds')
      .insert(worldData)
      .select()
      .single();

    if (error) throw error;
    
    this.currentWorldId = data.id;
    console.log(`🌍 Created world: ${name} (${data.id})`);
    return data;
  }

  // Save current game state efficiently
  async saveGameState(scene) {
    if (!this.currentWorldId) throw new Error('No active world');

    try {
      // 1. Update world tick count
      await this.supabase
        .from('worlds')
        .update({ 
          tick_count: scene.tickCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.currentWorldId);

      // 2. Save players (batch update)
      const playersData = scene.gameWorld.players.map(player => ({
        world_id: this.currentWorldId,
        name: player.name,
        color: player.color,
        resources: player.resources,
        start_coords: player.startCoords || [0, 0],
        is_human: player.name.includes('CPU') ? false : true
      }));

      await this.supabase
        .from('players')
        .upsert(playersData, { 
          onConflict: 'world_id,name',
          ignoreDuplicates: false 
        });

      // 3. Save buildings (only if changed)
      const buildingsData = [];
      scene.gameWorld.getAllBuildings().forEach(building => {
        buildingsData.push({
          world_id: this.currentWorldId,
          owner_id: this.getPlayerDbId(building.owner.name),
          type: building.type,
          hex_q: building.coords[0],
          hex_r: building.coords[1],
          completed: building.completed,
          ticks_build: building.ticksBuild,
          build_time: building.buildTime,
          metadata: {
            category: building.category,
            hitpoints: building.hitpoints,
            resource_type: building.resourcetype,
            resource_amount: building.resourceamount
          }
        });
      });

      if (buildingsData.length > 0) {
        // Delete old buildings for this world, then insert new ones
        await this.supabase
          .from('buildings')
          .delete()
          .eq('world_id', this.currentWorldId);
          
        await this.supabase
          .from('buildings')
          .insert(buildingsData);
      }

      // 4. Save units
      const unitsData = [];
      scene.gameWorld.getAllUnits().forEach(unit => {
        unitsData.push({
          world_id: this.currentWorldId,
          owner_id: this.getPlayerDbId(unit.owner.name),
          type: unit.type,
          hex_q: unit.coords[0],
          hex_r: unit.coords[1],
          hp: unit.hp,
          max_hp: unit.maxHp,
          experience: unit.experience || 0,
          destination: unit.destination ? [unit.destination.q, unit.destination.r] : null,
          stats: {
            attack: unit.attack || 0,
            defense: unit.defense || 0,
            range: unit.range || 1,
            level: unit.level || 1
          }
        });
      });

      if (unitsData.length > 0) {
        await this.supabase
          .from('units')
          .delete()
          .eq('world_id', this.currentWorldId);
          
        await this.supabase
          .from('units')
          .insert(unitsData);
      }

      // 5. Save important territories (only modified ones)
      const modifiedTerritories = this.getModifiedTerritories(scene.map);
      if (modifiedTerritories.length > 0) {
        await this.supabase
          .from('territories')
          .upsert(modifiedTerritories.map(tile => ({
            world_id: this.currentWorldId,
            hex_q: tile.q,
            hex_r: tile.r,
            biome: tile.biome,
            owner_id: tile.owner ? this.getPlayerDbId(tile.owner.name) : null,
            ore_type: tile.oreType || null
          })), { 
            onConflict: 'world_id,hex_q,hex_r' 
          });
      }

      console.log('✅ Game state saved to Supabase');
      return true;

    } catch (error) {
      console.error('❌ Save failed:', error);
      throw error;
    }
  }

  // Load game state
  async loadGameState(worldId) {
    try {
      this.currentWorldId = worldId;

      // 1. Load world info
      const { data: world } = await this.supabase
        .from('worlds')
        .select('*')
        .eq('id', worldId)
        .single();

      if (!world) throw new Error('World not found');

      // 2. Load players
      const { data: players } = await this.supabase
        .from('players')
        .select('*')
        .eq('world_id', worldId);

      // 3. Load buildings
      const { data: buildings } = await this.supabase
        .from('buildings')
        .select('*')
        .eq('world_id', worldId);

      // 4. Load units
      const { data: units } = await this.supabase
        .from('units')
        .select('*')
        .eq('world_id', worldId);

      // 5. Load modified territories
      const { data: territories } = await this.supabase
        .from('territories')
        .select('*')
        .eq('world_id', worldId);

      const gameState = {
        world,
        players,
        buildings,
        units,
        territories
      };

      console.log('✅ Game state loaded from Supabase');
      return gameState;

    } catch (error) {
      console.error('❌ Load failed:', error);
      throw error;
    }
  }

  // Get territories within range (efficient spatial query)
  async getTerritoriesInRange(centerQ, centerR, range) {
    const { data, error } = await this.supabase
      .rpc('get_territories_in_range', {
        p_world_id: this.currentWorldId,
        center_q: centerQ,
        center_r: centerR,
        max_range: range
      });

    if (error) throw error;
    return data;
  }

  // Setup real-time subscriptions for multiplayer
  setupRealTimeSync(scene, regionBounds = null) {
    // Subscribe to changes in your visible region
    let filter = `world_id=eq.${this.currentWorldId}`;
    
    if (regionBounds) {
      const { minQ, maxQ, minR, maxR } = regionBounds;
      filter += ` AND hex_q=gte.${minQ} AND hex_q=lte.${maxQ}`;
    }

    this.subscription = this.supabase
      .channel('world-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'buildings',
        filter
      }, (payload) => {
        this.handleBuildingUpdate(scene, payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public', 
        table: 'units',
        filter
      }, (payload) => {
        this.handleUnitUpdate(scene, payload);
      })
      .subscribe();

    console.log('🔄 Real-time sync enabled');
  }

  // Handle real-time updates
  handleBuildingUpdate(scene, payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch(eventType) {
      case 'INSERT':
        // Another player built something
        this.createBuildingFromDb(scene, newRecord);
        break;
      case 'UPDATE':
        // Building progress updated
        this.updateBuildingFromDb(scene, newRecord);
        break;
      case 'DELETE':
        // Building destroyed
        this.removeBuildingFromScene(scene, oldRecord);
        break;
    }
  }

  handleUnitUpdate(scene, payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch(eventType) {
      case 'INSERT':
        this.createUnitFromDb(scene, newRecord);
        break;
      case 'UPDATE':
        this.updateUnitFromDb(scene, newRecord);
        break;
      case 'DELETE':
        this.removeUnitFromScene(scene, oldRecord);
        break;
    }
  }

  // Helper methods
  getPlayerDbId(playerName) {
    // You'd maintain a mapping of player names to DB IDs
    return this.playerIdMap?.[playerName] || null;
  }

  getModifiedTerritories(hexMap) {
    // Return only tiles that have been changed from default
    return hexMap.getAllTiles().filter(tile => 
      tile.building || 
      tile.unit || 
      tile.owner || 
      tile.oreType
    );
  }

  // Auto-save functionality
  startAutoSave(scene, intervalMs = 30000) { // Save every 30 seconds
    this.autoSaveInterval = setInterval(() => {
      this.saveGameState(scene).catch(error => {
        console.warn('Auto-save failed:', error);
      });
    }, intervalMs);
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  // Cleanup
  disconnect() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.stopAutoSave();
  }
}

export default SupabaseGameState;