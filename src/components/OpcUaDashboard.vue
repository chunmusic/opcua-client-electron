<script setup>
import { ref, onUnmounted, reactive } from 'vue';

const endpointUrl = ref('opc.tcp://opcuaserver.com:48010');
const isConnected = ref(false);
const isConnecting = ref(false);
const errorMsg = ref('');
const logs = ref([]);

// Monitor State
const newNodeId = ref('ns=3;i=1001');
const monitoredItems = reactive([]); // { nodeId, value, dataType, cleanup }

// Write State
const nodeIdToWrite = ref('ns=3;i=1002');
const valueToWrite = ref('');
const dataTypeToWrite = ref('Double');

const addLog = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    logs.value.unshift({ time, msg, type });
    if (logs.value.length > 50) logs.value.pop();
};

const connect = async () => {
    errorMsg.value = '';
    isConnecting.value = true;
    addLog(`Connecting to ${endpointUrl.value}...`);
    try {
        const result = await window.electronAPI.opcuaConnect(endpointUrl.value);
        if (result === true) {
            isConnected.value = true;
            addLog('Connected successfully', 'success');
        } else {
            errorMsg.value = result.error || 'Connection failed';
            addLog(`Connection failed: ${errorMsg.value}`, 'error');
        }
    } catch (e) {
        errorMsg.value = e.message;
        addLog(e.message, 'error');
    } finally {
        isConnecting.value = false;
    }
};

const disconnect = async () => {
    monitoredItems.forEach(item => {
        if (item.cleanup) item.cleanup(); // Note: cleanup implementation depends on preload return, current POC preload doesn't return cleanup yet for IPC listeners fully but we can clear array
    });
    monitoredItems.splice(0, monitoredItems.length);
    
    await window.electronAPI.opcuaDisconnect();
    isConnected.value = false;
    addLog('Disconnected');
};

const addMonitor = () => {
    if (!isConnected.value) return;
    const nodeId = newNodeId.value;
    
    // Check if already monitoring
    if (monitoredItems.find(x => x.nodeId === nodeId)) return;

    addLog(`Subscribing to ${nodeId}`);
    
    const item = reactive({ nodeId, value: '---', dataType: '' });
    monitoredItems.push(item);

    // Subscribe
    const cleanup = window.electronAPI.opcuaSubscribe(nodeId, (val, type) => {
        item.value = val;
        item.dataType = type;
    });
    item.cleanup = cleanup;
};

const removeMonitor = (index) => {
    // In a real app we should unsubscribe from server too, strictly speaking.
    // For this POC we just remove from UI list.
    monitoredItems.splice(index, 1);
};

const writeNode = async () => {
    if (!isConnected.value) return;
    try {
        addLog(`Writing ${valueToWrite.value} (${dataTypeToWrite.value}) to ${nodeIdToWrite.value}`);
        
        const res = await window.electronAPI.opcuaWrite(nodeIdToWrite.value, valueToWrite.value, dataTypeToWrite.value);
        
        if (res !== true) {
            errorMsg.value = res.error || 'Write Failed';
            addLog(`Write Error: ${errorMsg.value}`, 'error');
        } else {
            addLog('Write Success!', 'success');
        }
    } catch (e) {
        errorMsg.value = e.message;
        addLog(e.message, 'error');
    }
};

onUnmounted(() => {
    // Cleanup implies disconnecting or unregistering listeners
});
</script>

<template>
  <div class="dashboard-wrapper">
    <!-- Server Connection Header -->
    <v-card class="mb-5 rounded-xl" elevation="0" style="box-shadow: 0 1px 4px rgba(0,0,0,0.05) !important;">
      <div class="d-flex align-center pa-5 gap-4">
        <!-- Title & Status -->
        <div class="d-flex align-center">
          <v-avatar :color="isConnected ? 'success' : 'grey-lighten-2'" rounded="lg" size="40" class="mr-3">
            <v-icon :color="isConnected ? 'white' : 'grey'" size="20">mdi-server-network</v-icon>
          </v-avatar>
          <div>
            <div class="text-h6 font-weight-bold text-grey-darken-3">OPC UA Client</div>
            <div class="text-subtitle-2" :class="isConnected ? 'text-success' : 'text-grey'">{{ isConnected ? 'Online' : 'Offline' }}</div>
          </div>
        </div>

        <!-- Server URL (Center/Grow) -->
        <v-text-field
          v-model="endpointUrl"
          density="compact"
          variant="outlined"
          hide-details
          placeholder="opc.tcp://server:port"
          rounded="lg"
          class="flex-grow-1 mx-4"
          :disabled="isConnected || isConnecting"
        ></v-text-field>
        
        <!-- Connect Button -->
        <v-btn
          min-width="120"
          height="56"
          rounded="lg"
          :color="isConnected ? 'error' : 'primary'"
          elevation="0"
          variant="flat"
          :loading="isConnecting"
          :disabled="isConnecting"
          class="text-subtitle-1 font-weight-bold"
          @click="isConnected ? disconnect() : connect()"
        >
          {{ isConnecting ? 'Connecting...' : (isConnected ? 'Disconnect' : 'Connect') }}
        </v-btn>
      </div>
      <v-progress-linear 
        v-if="errorMsg" 
        color="error" 
        indeterminate 
        height="3"
      ></v-progress-linear>
    </v-card>

    <!-- Top Row: Monitoring & Controls -->
    <v-row>
      <!-- Monitoring Card -->
      <v-col cols="12" md="6">
        <v-card class="rounded-xl elevation-0 fill-height" style="box-shadow: 0 1px 4px rgba(0,0,0,0.05) !important;">
          <v-card-item class="pa-5">
            <div class="d-flex justify-space-between align-center mb-4">
              <div class="d-flex align-center">
                <v-avatar color="cyan-lighten-5" rounded="lg" size="44" class="mr-3">
                  <v-icon color="cyan-darken-1" size="22">mdi-chart-line-variant</v-icon>
                </v-avatar>
                <div>
                  <div class="text-subtitle-2 text-grey-darken-1 font-weight-medium">Node Subscriptions</div>
                  <div class="text-h6 font-weight-bold">Monitored Items</div>
                </div>
              </div>
              <v-btn variant="text" color="grey" icon="mdi-dots-vertical" size="small"></v-btn>
            </div>

            <!-- Add Monitor Input -->
            <div class="d-flex align-center mb-4 bg-grey-lighten-5 pa-2 rounded-lg">
              <v-text-field
                v-model="newNodeId"
                density="compact"
                variant="plain"
                hide-details
                placeholder="Add Node ID (ns=3;i=1001)..."
                @keyup.enter="addMonitor"
                class="ml-2"
              ></v-text-field>
              <v-btn color="cyan-darken-1" size="small" icon="mdi-plus" variant="text" @click="addMonitor"></v-btn>
            </div>

            <!-- Monitored Items List -->
            <v-list class="bg-transparent py-0" lines="one" density="compact">
              <v-list-item v-for="(item, idx) in monitoredItems" :key="idx" class="px-0 py-2 border-b-thin">
                <template v-slot:prepend>
                  <div class="d-flex align-center justify-center bg-cyan-lighten-5 rounded-lg mr-3" style="width: 36px; height: 36px;">
                    <span class="text-caption font-weight-bold text-cyan-darken-2">{{ idx + 1 }}</span>
                  </div>
                </template>
                
                <v-list-item-title class="font-weight-medium text-body-2">{{ item.nodeId }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption text-grey">{{ item.dataType || 'Auto' }}</v-list-item-subtitle>
                
                <template v-slot:append>
                  <div class="d-flex align-center">
                    <div class="text-subtitle-1 font-weight-bold text-grey-darken-3 mr-3 font-mono">{{ item.value || '---' }}</div>
                    <v-btn icon="mdi-close" variant="text" size="x-small" color="grey" @click="removeMonitor(idx)"></v-btn>
                  </div>
                </template>
              </v-list-item>
              <div v-if="monitoredItems.length === 0" class="text-center py-8 text-grey">
                <v-icon size="40" color="grey-lighten-3" class="mb-2">mdi-playlist-remove</v-icon>
                <div class="text-caption">No nodes subscribed</div>
              </div>
            </v-list>
          </v-card-item>
        </v-card>
      </v-col>

      <!-- Control Card -->
      <v-col cols="12" md="6">
        <v-card class="rounded-xl elevation-0 fill-height d-flex flex-column" style="box-shadow: 0 1px 4px rgba(0,0,0,0.05) !important;">
          <v-card-text class="pa-6 flex-grow-1 d-flex flex-column text-left">
            <div class="d-flex justify-space-between align-start mb-5 w-100">
              <div>
                <div class="text-caption text-grey-darken-1 font-weight-bold">WRITE VALUE</div>
                <div class="text-h6 font-weight-bold">Node Write</div>
              </div>
              <v-avatar color="red-lighten-5" rounded="lg" size="44">
                <v-icon color="red-accent-2" size="22">mdi-pencil-box-outline</v-icon>
              </v-avatar>
            </div>

            <div class="flex-grow-1 w-100">
              <v-text-field 
                v-model="nodeIdToWrite" 
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
              size="x-large"
              height="56" 
              rounded="lg" 
              @click="writeNode"
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
        <v-card class="rounded-xl elevation-0" style="box-shadow: 0 1px 4px rgba(0,0,0,0.05) !important;">
          <v-card-item class="pa-4">
            <div class="d-flex justify-space-between align-center mb-3">
              <div class="d-flex align-center">
                <v-avatar color="deep-purple-lighten-5" rounded="lg" size="36" class="mr-3">
                  <v-icon size="18" color="deep-purple-darken-1">mdi-console-line</v-icon>
                </v-avatar>
                <span class="text-subtitle-2 font-weight-bold">System Logs</span>
              </div>
              <v-btn icon="mdi-delete-sweep-outline" variant="text" size="small" color="grey" @click="logs=[]"></v-btn>
            </div>
            
            <div class="logs-area overflow-y-auto" style="max-height: 150px;">
              <div v-for="(log, i) in logs" :key="i" class="d-flex align-start py-1 text-caption">
                <v-icon size="x-small" :color="log.type === 'error' ? 'error' : (log.type === 'success' ? 'success' : 'info')" class="mt-1 mr-2">mdi-circle</v-icon>
                <span class="text-grey-darken-1 mr-2">{{ log.time }}</span>
                <span :class="log.type === 'error' ? 'text-error' : 'text-grey-darken-3'">{{ log.msg }}</span>
              </div>
              <div v-if="logs.length === 0" class="text-center text-grey text-caption py-4">System Ready — No activity yet</div>
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
