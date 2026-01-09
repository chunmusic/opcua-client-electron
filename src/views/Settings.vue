<script setup>
import { computed, onMounted, ref } from 'vue'
import { opcuaStore } from '../stores/opcua.js'
import { useTheme } from 'vuetify'

const theme = useTheme()
const newEndpoint = ref('')

const currentTheme = computed({
    get: () => opcuaStore.state.theme,
    set: (val) => {
        opcuaStore.saveSetting('theme', val)
        theme.global.name.value = val
    }
})

const savedEndpoints = computed(() => opcuaStore.state.endpointUrls)

function addEndpoint() {
    if (newEndpoint.value && !savedEndpoints.value.includes(newEndpoint.value)) {
        const updated = [...savedEndpoints.value, newEndpoint.value]
        opcuaStore.saveSetting('endpointUrls', updated)
        newEndpoint.value = ''
    }
}

function removeEndpoint(url) {
    const updated = savedEndpoints.value.filter(u => u !== url)
    opcuaStore.saveSetting('endpointUrls', updated)
}

onMounted(() => {
    opcuaStore.initSettings()
})
</script>

<template>
  <v-container fluid class="pa-0 fill-height align-start">
    <v-card class="w-100 fill-height rounded-xl d-flex flex-column" elevation="0" style="box-shadow: 0 1px 4px rgba(0,0,0,0.05) !important;">
      <!-- Header -->
      <v-card-title class="pa-4 d-flex align-center border-b" style="height: 72px;">
        <v-icon color="medium-emphasis" class="mr-3">mdi-cog-outline</v-icon>
        <span class="text-h6 font-weight-bold">Settings</span>
      </v-card-title>

      <v-card-text class="pa-6">
        <!-- Appearance Section -->
        <div class="mb-8">
            <div class="text-subtitle-1 font-weight-bold mb-2">Appearance</div>
            <v-btn-toggle v-model="currentTheme" mandatory color="primary" rounded="lg" class="border">
                <v-btn value="light" prepend-icon="mdi-white-balance-sunny">Light</v-btn>
                <v-btn value="dark" prepend-icon="mdi-weather-night">Dark</v-btn>
            </v-btn-toggle>
        </div>

        <!-- Connection Management -->
        <div>
             <div class="text-subtitle-1 font-weight-bold mb-2">Saved Endpoints</div>
             <div class="d-flex flex-column gap-3 mb-4">
                 <div v-for="(url, i) in savedEndpoints" :key="i" class="d-flex align-center">
                     <v-text-field
                        :model-value="url"
                        readonly
                        density="compact"
                        variant="outlined"
                        hide-details
                        rounded="lg"
                        class="flex-grow-1"
                        bg-color="grey-lighten-5"
                        style="font-size: 1.1rem;"
                     >
                        <template v-slot:append-inner>
                             <v-btn icon="mdi-delete-outline" variant="text" color="error" size="small" @click="removeEndpoint(url)"></v-btn>
                        </template>
                     </v-text-field>
                 </div>
                 <div v-if="savedEndpoints.length === 0" class="text-medium-emphasis italic text-body-1">No saved endpoints</div>
             </div>
             
             <div class="d-flex">
                 <v-text-field 
                    v-model="newEndpoint" 
                    placeholder="opc.tcp://server:port" 
                    density="compact" 
                    variant="outlined" 
                    hide-details
                    class="flex-grow-1"
                    rounded="lg"
                 ></v-text-field>
                 <v-btn color="primary" height="40" rounded="lg" class="ml-4" @click="addEndpoint">Add</v-btn>
             </div>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>
