<script setup>
import { computed } from 'vue'
import { opcuaStore } from '../stores/opcua.js'

const headers = [
  { title: 'Node ID', key: 'nodeId', align: 'center', headerProps: { class: 'font-weight-bold text-center justify-center' } },
  { title: 'Value', key: 'value', align: 'center', headerProps: { class: 'font-weight-bold text-center justify-center' } },
  { title: 'Data Type', key: 'dataType', align: 'center', headerProps: { class: 'font-weight-bold text-center justify-center' } },
  { title: 'Last Update', key: 'timestamp', align: 'center', headerProps: { class: 'font-weight-bold text-center justify-center' } },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false, headerProps: { class: 'font-weight-bold text-center justify-center' } }
]

function removeMonitor(nodeId) {
    const idx = opcuaStore.state.monitoredItems.findIndex(x => x.nodeId === nodeId)
    if (idx > -1) opcuaStore.state.monitoredItems.splice(idx, 1)
}

function getValueColor(val) {
    if (val === true || val === 'true') return 'success'
    if (val === false || val === 'false') return 'error'
    if (typeof val === 'number') return 'primary'
    return 'grey-darken-3'
}
</script>

<template>
  <v-container fluid class="pa-0 fill-height align-start">
    <v-card class="w-100 fill-height rounded-xl d-flex flex-column" elevation="0" style="box-shadow: 0 1px 4px rgba(0,0,0,0.05) !important;">
      <!-- Header -->
      <v-card-title class="pa-4 d-flex align-center border-b" style="height: 72px;">
        <v-icon color="cyan-darken-1" class="mr-3">mdi-chart-box-outline</v-icon>
        <span class="text-h6 font-weight-bold">Monitored Items</span>
        
        <v-spacer></v-spacer>
        
        <v-chip class="mr-2" size="small" variant="flat" :color="opcuaStore.state.isConnected ? 'success' : 'grey'">
            {{ opcuaStore.state.isConnected ? 'Connected' : 'Offline' }}
        </v-chip>
      </v-card-title>

      <!-- Grid Content -->
      <v-card-text class="pa-0 flex-grow-1">
        <v-data-table
            :headers="headers"
            :items="opcuaStore.state.monitoredItems"
            density="comfortable"
            hover
            class="fill-height"
        >
            <template v-slot:item.value="{ item }">
                <span class="text-subtitle-1 font-weight-bold font-mono" :class="`text-${getValueColor(item.value)}`">
                    {{ item.value }}
                </span>
            </template>
            
            <template v-slot:item.dataType="{ item }">
                <v-chip size="x-small" label class="text-caption">{{ item.dataType || 'Auto' }}</v-chip>
            </template>
            
            <template v-slot:item.timestamp="{ item }">
                <span class="text-caption text-grey">{{ item.timestamp }}</span>
            </template>

            <template v-slot:item.actions="{ item }">
                <v-btn icon="mdi-delete-outline" variant="text" size="small" color="grey" @click="removeMonitor(item.nodeId)"></v-btn>
            </template>
            
            <template v-slot:no-data>
                <div class="pa-8 text-center text-grey">
                    <v-icon size="64" color="grey-lighten-2" class="mb-3">mdi-chart-line-variant</v-icon>
                    <div class="text-body-1">No items monitored. Add items from the Dashboard.</div>
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
  text-align: center !important;
}

:deep(.v-data-table-header__content) {
  justify-content: center !important;
}
</style>
