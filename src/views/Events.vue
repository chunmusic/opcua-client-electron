<script setup>
import { computed, onMounted } from 'vue'
import { opcuaStore } from '../stores/opcua.js'

const headers = [
  { title: 'Time', key: 'time', align: 'start', width: '120px' },
  { title: 'Severity', key: 'severity', align: 'center', width: '100px' },
  { title: 'Source', key: 'sourceName', align: 'start' },
  { title: 'Message', key: 'message', align: 'start' }
]

function getSeverityColor(severity) {
    if (severity >= 700) return 'error' // High/Critical
    if (severity >= 500) return 'warning' // Medium
    if (severity >= 200) return 'info' // Low
    return 'grey'
}

function getSeverityLabel(severity) {
    if (severity >= 700) return 'CRITICAL'
    if (severity >= 500) return 'WARNING'
    if (severity >= 200) return 'INFO'
    return 'DEBUG'
}

// Auto-subscribe on mount if connected
onMounted(() => {
    if (opcuaStore.state.isConnected) {
        // Trigger backend subscription
        window.electronAPI.opcuaSubscribeEvents((eventData) => {
            opcuaStore.addEvent(eventData)
        })
    }
})
</script>

<template>
  <v-container fluid class="pa-0 fill-height align-start">
    <v-card class="w-100 fill-height rounded-xl d-flex flex-column" elevation="0" style="box-shadow: 0 1px 4px rgba(0,0,0,0.05) !important;">
      <!-- Header -->
      <v-card-title class="pa-4 d-flex align-center border-b" style="height: 72px;">
        <v-icon color="orange-darken-2" class="mr-3">mdi-bell-ring-outline</v-icon>
        <span class="text-h6 font-weight-bold">Events & Alarms</span>
        
        <v-spacer></v-spacer>
        
        <v-btn size="small" variant="text" color="grey" icon="mdi-delete-sweep" @click="opcuaStore.state.events = []" title="Clear Events"></v-btn>
      </v-card-title>

      <!-- Event Log Grid -->
      <v-card-text class="pa-0 flex-grow-1">
        <v-data-table
            :headers="headers"
            :items="opcuaStore.state.events"
            density="compact"
            hover
            class="fill-height"
            fixed-header
        >
            <template v-slot:item.time="{ item }">
                <span class="text-caption font-mono text-medium-emphasis">{{ new Date(item.time).toLocaleTimeString() }}</span>
            </template>
            
            <template v-slot:item.severity="{ item }">
                <v-chip size="x-small" :color="getSeverityColor(item.severity)" label class="font-weight-bold">
                    {{ getSeverityLabel(item.severity) }}
                </v-chip>
            </template>
            
            <template v-slot:item.sourceName="{ item }">
                 <span class="text-caption font-weight-medium text-high-emphasis">{{ item.sourceName }}</span>
            </template>

            <template v-slot:item.message="{ item }">
                <span class="text-body-2 text-high-emphasis">{{ item.message }}</span>
            </template>
            
            <template v-slot:no-data>
                <div class="pa-8 text-center text-grey">
                    <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-bell-outline</v-icon>
                    <div class="text-body-1">No events received yet.</div>
                    <div class="text-body-1 mt-2">Make sure you are connected to the server.</div>
                </div>
            </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped>
:deep(.v-data-table__th) {
  font-size: 0.9rem !important;
  font-weight: 700 !important;
  text-transform: uppercase;
  color: rgba(0,0,0,0.6);
}
</style>
