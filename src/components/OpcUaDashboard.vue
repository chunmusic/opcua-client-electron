<script setup>
import { ref } from 'vue'
import { opcuaStore } from '../stores/opcua.js'
import { useTheme } from 'vuetify'

const theme = useTheme()

// Local UI state (Inputs that don't need to be global)
const dataTypeToWrite = ref('Double')
const valueToWrite = ref('55.5')
const nodeIdToMonitor = ref('ns=3;i=1001')

// Connect Action
async function connect() {
  if (opcuaStore.state.isConnected) {
    opcuaStore.setConnecting(true)
    try {
        await window.electronAPI.opcuaDisconnect()
        opcuaStore.reset()
        opcuaStore.addLog({ message: 'Disconnected from server', type: 'info' })
    } catch (err) {
        console.error(err)
    } finally {
        opcuaStore.setConnecting(false)
    }
  } else {
    opcuaStore.setConnecting(true)
    opcuaStore.setError(null)
    try {
      opcuaStore.addLog({ message: `Connecting to ${opcuaStore.state.endpointUrl}...`, type: 'info' })
      const result = await window.electronAPI.opcuaConnect(opcuaStore.state.endpointUrl)
      if (result === true) {
        opcuaStore.setConnected(true)
        opcuaStore.addLog({ message: 'Connected successfully', type: 'success' })
      } else {
        opcuaStore.setError(result.error || 'Connection failed')
        opcuaStore.addLog({ message: `Connection failed: ${result.error}`, type: 'error' })
      }
    } catch (err) {
      opcuaStore.setError(err.message)
      opcuaStore.addLog({ message: `Connection Error: ${err.message}`, type: 'error' })
    } finally {
      opcuaStore.setConnecting(false)
    }
  }
}

// Write Action
async function writeValue() {
  try {
    opcuaStore.addLog({ message: `Writing ${valueToWrite.value} to ${opcuaStore.state.nodeIdToWrite}`, type: 'info' })
    const result = await window.electronAPI.opcuaWrite(opcuaStore.state.nodeIdToWrite, valueToWrite.value, dataTypeToWrite.value)
    if (result === true) {
      opcuaStore.addLog({ message: `Write success`, type: 'success' })
    } else {
      opcuaStore.addLog({ message: `Write error: ${result.error}`, type: 'error' })
    }
  } catch (err) {
    opcuaStore.addLog({ message: `Write exception: ${err.message}`, type: 'error' })
  }
}

// Subscribe Action
function subscribe() {
  if (!nodeIdToMonitor.value) return
  
  window.electronAPI.opcuaSubscribe(nodeIdToMonitor.value, (val, type) => {
    opcuaStore.updateItem(nodeIdToMonitor.value, val, type)
  })
  
  opcuaStore.addLog({ message: `Subscribed to ${nodeIdToMonitor.value}`, type: 'info' })
}

function removeMonitor(nodeId) {
    const idx = opcuaStore.state.monitoredItems.findIndex(x => x.nodeId === nodeId)
    if (idx > -1) opcuaStore.state.monitoredItems.splice(idx, 1)
}
</script>

<template>
  <div class="dashboard-wrapper">
    <!-- Server Connection Header -->
    <v-card class="mb-5 rounded-xl border-0" elevation="0" style="box-shadow: 0 1px 4px rgba(0,0,0,0.05) !important;">
      <div class="d-flex align-center pa-5 gap-4">
        <!-- Title & Status -->
        <div class="d-flex align-center">
          <v-avatar :color="opcuaStore.state.isConnected ? 'success' : 'surface-variant'" rounded="lg" size="40" class="mr-3">
            <v-icon :color="opcuaStore.state.isConnected ? 'white' : (theme.global.current.value.dark ? '#424242' : '#C8C8C8')" size="20">mdi-server-network</v-icon>
          </v-avatar>
          <div>
            <div class="text-h6 font-weight-bold">OPC UA Client</div>
            <div class="text-subtitle-2" :class="opcuaStore.state.isConnected ? 'text-success' : 'text-medium-emphasis'">{{ opcuaStore.state.isConnected ? 'Online' : 'Offline' }}</div>
          </div>
        </div>

        <!-- Server URL (Center/Grow) -->
        <v-text-field
          v-model="opcuaStore.state.endpointUrl"
          density="compact"
          variant="outlined"
          hide-details
          placeholder="opc.tcp://server:port"
          rounded="lg"
          class="flex-grow-1 mx-4"
          :disabled="opcuaStore.state.isConnected || opcuaStore.state.isConnecting"
        ></v-text-field>
        
        <!-- Connect Button -->
        <v-btn
          min-width="120"
          height="40"
          rounded="lg"
          :color="opcuaStore.state.isConnected ? 'error' : 'primary'"
          elevation="0"
          variant="flat"
          :loading="opcuaStore.state.isConnecting"
          :disabled="opcuaStore.state.isConnecting"
          class="text-subtitle-1 font-weight-bold"
          @click="connect"
        >
          {{ opcuaStore.state.isConnecting ? 'Connecting...' : (opcuaStore.state.isConnected ? 'Disconnect' : 'Connect') }}
        </v-btn>
      </div>
      <v-progress-linear 
        v-if="opcuaStore.state.isConnecting" 
        color="primary" 
        indeterminate 
        height="3"
      ></v-progress-linear>
      
      <!-- Error Alert -->
       <v-expand-transition>
            <div v-if="opcuaStore.state.error" class="pa-4 pt-0">
                <v-alert
                    color="error"
                    variant="tonal"
                    icon="mdi-alert-circle"
                    border="start"
                    closable
                    @click:close="opcuaStore.setError(null)"
                    class="rounded-lg"
                >
                    {{ opcuaStore.state.error }}
                </v-alert>
            </div>
        </v-expand-transition>
    </v-card>

    <!-- Top Row: Monitoring & Controls -->
    <v-row>
      <!-- Monitoring Card -->
      <v-col cols="12" md="6">
        <v-card class="rounded-xl elevation-0 fill-height border-0" style="box-shadow: 0 1px 4px rgba(0,0,0,0.05) !important;">
          <v-card-item class="pa-5">
            <div class="d-flex justify-space-between align-center mb-4">
              <div class="d-flex align-center">
                <v-avatar color="cyan" variant="tonal" rounded="lg" size="44" class="mr-3">
                  <v-icon size="22">mdi-chart-line-variant</v-icon>
                </v-avatar>
                <div>
                  <div class="text-subtitle-2 text-medium-emphasis font-weight-medium">Node Subscriptions</div>
                  <div class="text-h6 font-weight-bold">Monitored Items</div>
                </div>
              </div>
              <v-btn variant="text" color="medium-emphasis" icon="mdi-dots-vertical" size="small"></v-btn>
            </div>

            <!-- Add Monitor Input -->
            <v-theme-provider theme="light" with-background class="d-flex align-center mb-4 pa-2 rounded-lg">
              <v-text-field
                v-model="nodeIdToMonitor"
                density="compact"
                variant="plain"
                hide-details
                placeholder="Add Node ID (ns=3;i=1001)..."
                @keyup.enter="subscribe"
                class="ml-2 centered-input"
                style="display: flex; align-items: center; font-size: 1.1rem;"
              ></v-text-field>
              <v-btn color="cyan" size="small" icon="mdi-plus" variant="text" @click="subscribe"></v-btn>
            </v-theme-provider>

            <!-- Monitored Items List -->
            <v-list class="bg-transparent py-0" lines="one" density="compact">
              <v-list-item v-for="(item, idx) in opcuaStore.state.monitoredItems" :key="item.nodeId" class="px-0 py-2 border-b-thin">
                <template v-slot:prepend>
                  <div class="d-flex align-center justify-center rounded-lg mr-3 bg-cyan" style="width: 36px; height: 36px; --v-theme-overlay-multiplier: 0.1;">
                     <v-theme-provider theme="light" with-background class="fill-height w-100 d-flex align-center justify-center rounded-lg" style="background: rgba(var(--v-theme-cyan), 0.1) !important;">
                        <span class="text-caption font-weight-bold text-cyan-darken-1">{{ idx + 1 }}</span>
                     </v-theme-provider>
                  </div>
                </template>
                
                <v-list-item-title class="font-weight-medium text-body-2">{{ item.nodeId }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption text-medium-emphasis">{{ item.dataType || 'Auto' }}</v-list-item-subtitle>
                
                <template v-slot:append>
                  <div class="d-flex align-center">
                    <div class="text-subtitle-1 font-weight-bold text-high-emphasis mr-3 font-mono">{{ item.value || '---' }}</div>
                    <v-btn icon="mdi-close" variant="text" size="x-small" color="medium-emphasis" @click="removeMonitor(item.nodeId)"></v-btn>
                  </div>
                </template>
              </v-list-item>
              <div v-if="opcuaStore.state.monitoredItems.length === 0" class="text-center py-8 text-medium-emphasis">
                <v-icon size="40" color="surface-variant" class="mb-2">mdi-playlist-remove</v-icon>
                <div class="text-body-1">No nodes subscribed</div>
              </div>
            </v-list>
          </v-card-item>
        </v-card>
      </v-col>

      <!-- Control Card -->
      <v-col cols="12" md="6">
        <v-card class="rounded-xl elevation-0 fill-height d-flex flex-column border-0" style="box-shadow: 0 1px 4px rgba(0,0,0,0.05) !important;">
          <v-card-text class="pa-6 flex-grow-1 d-flex flex-column text-left">
            <div class="d-flex justify-space-between align-start mb-5 w-100">
              <div>
                <div class="text-caption text-medium-emphasis font-weight-bold">WRITE VALUE</div>
                <div class="text-h6 font-weight-bold">Node Write</div>
              </div>
              <v-avatar color="red" variant="tonal" rounded="lg" size="44">
                <v-icon size="22">mdi-pencil-box-outline</v-icon>
              </v-avatar>
            </div>

            <div class="flex-grow-1 w-100">
              <v-text-field 
                v-model="opcuaStore.state.nodeIdToWrite" 
                label="Node ID" 
                variant="outlined" 
                density="comfortable"
                color="primary" 
                class="mb-5 large-input" 
                rounded="lg" 
                hide-details
              ></v-text-field>
              <v-select 
                v-model="dataTypeToWrite" 
                label="Data Type" 
                :items="['Double', 'Int32', 'Boolean', 'String']" 
                variant="outlined" 
                density="comfortable"
                color="primary" 
                class="mb-5 large-input" 
                rounded="lg" 
                hide-details
              ></v-select>
              <v-textarea 
                v-model="valueToWrite" 
                label="Value" 
                variant="outlined" 
                rows="5" 
                color="primary" 
                class="mb-5 large-input" 
                rounded="lg" 
                hide-details
              ></v-textarea>
            </div>
            <v-btn 
              block 
              color="primary" 
              elevation="0" 
              height="40" 
              rounded="lg" 
              @click="writeValue"
              class="w-100 text-subtitle-1 font-weight-bold"
            >
              Write Value
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Bottom Row: System Logs -->
    <v-row class="mt-1">
      <v-col cols="12">
        <v-card class="rounded-xl elevation-0 border-0" style="box-shadow: 0 1px 4px rgba(0,0,0,0.05) !important;">
          <v-card-item class="pa-4">
            <div class="d-flex justify-space-between align-center mb-3">
              <div class="d-flex align-center">
                <v-avatar color="deep-purple" variant="tonal" rounded="lg" size="36" class="mr-3">
                  <v-icon size="18">mdi-console-line</v-icon>
                </v-avatar>
                <span class="text-h6 font-weight-bold">System Logs</span>
              </div>
              <v-btn icon="mdi-delete-sweep-outline" variant="text" color="medium-emphasis" @click="opcuaStore.state.logs = []"></v-btn>
            </div>
            
            <div class="logs-area overflow-y-auto" style="max-height: 150px;">
              <div v-for="(log, i) in opcuaStore.logs" :key="log.id || i" class="d-flex align-start py-1 text-caption">
                <v-icon size="x-small" :color="log.type === 'error' ? 'error' : (log.type === 'success' ? 'success' : 'info')" class="mt-1 mr-2">mdi-circle</v-icon>
                <span class="text-medium-emphasis mr-2">{{ log.time }}</span>
                <span :class="log.type === 'error' ? 'text-error' : 'text-high-emphasis'">{{ log.message }}</span>
              </div>
              <div v-if="opcuaStore.logs.length === 0" class="text-center text-medium-emphasis text-body-1 py-4">System Ready — No activity yet</div>
            </div>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.gap-6 { gap: 24px; }
.font-mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; }

.gradient-btn {
  background: linear-gradient(135deg, #5D87FF 0%, #49BEFF 100%) !important;
}

.card-shadow {
  box-shadow: 0 1px 4px rgba(0,0,0,0.05) !important;
}

/* Centered Input Override */
.centered-input :deep(.v-field__input) {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  min-height: 32px;
  display: flex !important;
  align-items: center !important;
}

/* Large Input Overrides */
.large-input :deep(.v-field__input),
.large-input :deep(.v-select__selection-text) {
  font-size: 1.2rem !important; /* ~19px */
  line-height: 1.5;
}
.large-input :deep(.v-field__input::placeholder) {
  font-size: 1.2rem !important;
  opacity: 0.7;
}
.large-input :deep(.v-label.v-field-label) {
  font-size: 1rem !important;
  top: 2px !important; /* Adjust label position for larger input */
}
</style>
