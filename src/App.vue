<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import OpcUaDashboard from './components/OpcUaDashboard.vue'
import AddressSpace from './views/AddressSpace.vue'
import MonitoredItems from './views/MonitoredItems.vue'
import Events from './views/Events.vue'
import Certificates from './views/Certificates.vue'
import Settings from './views/Settings.vue'
import { useTheme } from 'vuetify'
import { opcuaStore } from './stores/opcua.js'

const theme = useTheme()

function toggleTheme() {
    const newVal = theme.global.name.value === 'light' ? 'dark' : 'light'
    theme.global.name.value = newVal
    opcuaStore.saveSetting('theme', newVal)
}

// Watch store theme changes (e.g. from Settings page) and apply
watch(() => opcuaStore.state.theme, (newVal) => {
    if (newVal && theme.global.name.value !== newVal) {
        theme.global.name.value = newVal
    }
})

// Init store
onMounted(() => {
    opcuaStore.initSettings().then(() => {
        if (opcuaStore.state.theme) {
            theme.global.name.value = opcuaStore.state.theme
        }
    })
})

const drawer = ref(true)
// const currentViewName = ref('dashboard') // Removed in favor of store


// Map menu values to components
const views = {
  dashboard: OpcUaDashboard,
  browser: AddressSpace,
  monitored: MonitoredItems,
  events: Events,
  certificates: Certificates,
  settings: Settings
}

const currentComponent = computed(() => views[opcuaStore.state.currentView])
</script>

<template>
  <v-app>
    <!-- Sidebar Navigation -->
    <v-navigation-drawer
      v-model="drawer"
      permanent
      class="sidebar-shadow border-0"
    >
      <!-- Logo -->
      <div class="d-flex align-center pa-4">
        <v-avatar color="primary" size="32" class="mr-2" rounded="lg">
          <v-icon icon="mdi-server-network" color="white" size="18"></v-icon>
        </v-avatar>
        <span class="text-subtitle-1 font-weight-bold">OPC Client</span>
      </div>

      <v-divider></v-divider>

      <v-list nav class="px-2 py-3 nav-menu">
        <v-list-subheader class="text-overline">Dashboards</v-list-subheader>
        
        <!-- Dashboard -->
        <v-list-item 
          value="dashboard" 
          rounded="lg"
          class="mb-1"
          :class="{ 'nav-item-active': opcuaStore.state.currentView === 'dashboard' }"
          @click="opcuaStore.setCurrentView('dashboard')"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-view-dashboard-outline" :class="opcuaStore.state.currentView === 'dashboard' ? 'text-white' : ''" size="22"></v-icon>
          </template>
          <v-list-item-title class="font-weight-medium text-body-1" :class="opcuaStore.state.currentView === 'dashboard' ? 'text-white' : 'text-medium-emphasis'">Dashboard</v-list-item-title>
        </v-list-item>

        <!-- Address Space -->
        <v-list-item 
          value="browser" 
          rounded="lg" 
          class="mb-1"
          :class="{ 'nav-item-active': opcuaStore.state.currentView === 'browser' }"
          @click="opcuaStore.setCurrentView('browser')"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-file-tree" :class="opcuaStore.state.currentView === 'browser' ? 'text-white' : ''" size="22"></v-icon>
          </template>
          <v-list-item-title class="text-body-1" :class="opcuaStore.state.currentView === 'browser' ? 'text-white' : 'text-medium-emphasis'">Address Space</v-list-item-title>
        </v-list-item>

        <!-- Monitored Items -->
        <v-list-item 
          value="monitored" 
          rounded="lg" 
          class="mb-1"
          :class="{ 'nav-item-active': opcuaStore.state.currentView === 'monitored' }"
          @click="opcuaStore.setCurrentView('monitored')"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-chart-box-outline" :class="opcuaStore.state.currentView === 'monitored' ? 'text-white' : ''" size="22"></v-icon>
          </template>
          <v-list-item-title class="text-body-1" :class="opcuaStore.state.currentView === 'monitored' ? 'text-white' : 'text-medium-emphasis'">Monitored Items</v-list-item-title>
        </v-list-item>

        <v-list-subheader class="text-overline mt-4">Features</v-list-subheader>

        <!-- Events -->
        <v-list-item 
          value="events" 
          rounded="lg" 
          class="mb-1"
          :class="{ 'nav-item-active': opcuaStore.state.currentView === 'events' }"
          @click="opcuaStore.setCurrentView('events')"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-bell-ring-outline" :class="opcuaStore.state.currentView === 'events' ? 'text-white' : ''" size="22"></v-icon>
          </template>
          <v-list-item-title class="text-body-1" :class="opcuaStore.state.currentView === 'events' ? 'text-white' : 'text-medium-emphasis'">Events & Alarms</v-list-item-title>
        </v-list-item>

        <!-- Certificates -->
        <v-list-item 
          value="certificates" 
          rounded="lg" 
          class="mb-1"
          :class="{ 'nav-item-active': opcuaStore.state.currentView === 'certificates' }"
          @click="opcuaStore.setCurrentView('certificates')"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-certificate-outline" :class="opcuaStore.state.currentView === 'certificates' ? 'text-white' : ''" size="22"></v-icon>
          </template>
          <v-list-item-title class="text-body-1" :class="opcuaStore.state.currentView === 'certificates' ? 'text-white' : 'text-medium-emphasis'">Certificates</v-list-item-title>
        </v-list-item>

        <v-list-subheader class="text-overline mt-4">System</v-list-subheader>

        <!-- Settings -->
        <v-list-item 
          value="settings" 
          rounded="lg" 
          class="mb-1"
          :class="{ 'nav-item-active': opcuaStore.state.currentView === 'settings' }"
          @click="opcuaStore.setCurrentView('settings')"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-cog-outline" :class="opcuaStore.state.currentView === 'settings' ? 'text-white' : ''" size="22"></v-icon>
          </template>
          <v-list-item-title class="text-body-1" :class="opcuaStore.state.currentView === 'settings' ? 'text-white' : 'text-medium-emphasis'">Settings</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Top Header Bar (Minimal) -->
    <v-app-bar elevation="0" color="transparent" height="56">
      <v-btn icon="mdi-menu" variant="text" @click.stop="drawer = !drawer"></v-btn>
      
      <v-spacer></v-spacer>

      <v-btn 
        icon 
        variant="text" 
        :color="theme.global.name.value === 'dark' ? 'yellow-darken-3' : 'grey-darken-2'" 
        class="mr-2"
        @click="toggleTheme"
      >
        <v-icon>{{ theme.global.name.value === 'dark' ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}</v-icon>
      </v-btn>

      <v-avatar size="36" class="mr-4" color="primary">
        <span class="text-caption text-white font-weight-bold">OP</span>
      </v-avatar>
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <v-container fluid class="pa-6">
        <KeepAlive>
          <component :is="currentComponent" />
        </KeepAlive>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.nav-item-active {
  background: linear-gradient(135deg, #5D87FF 0%, #49BEFF 100%) !important;
}

.sidebar-shadow {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08) !important;
  border: none !important;
}

/* Tighter spacing between icons and text in nav items */
:deep(.v-list-item__prepend) {
  margin-inline-end: 12px !important;
}

/* Enforce consistent font size for nav items */
:deep(.v-list-item-title) {
  font-size: 1rem !important; /* 16px */
  line-height: 1.5rem;
}

/* Remove default spacer in nav items */
:deep(.v-list-item__spacer) {
  display: none !important;
}
</style>
