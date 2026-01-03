<script setup>
import OpcUaDashboard from './components/OpcUaDashboard.vue'
import { ref } from 'vue'

const drawer = ref(true)
</script>

<template>
  <v-app class="bg-grey-lighten-4">
    <!-- Sidebar Navigation -->
    <v-navigation-drawer
      v-model="drawer"
      permanent
      color="white"
      width="240"
      class="sidebar-shadow"
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
        <v-list-subheader class="text-overline text-grey">Dashboards</v-list-subheader>
        
        <!-- Dashboard -->
        <v-list-item 
          value="dashboard" 
          active
          rounded="lg"
          class="mb-1 nav-item-active"
          base-color="white"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-view-dashboard-outline" color="white" size="22"></v-icon>
          </template>
          <v-list-item-title class="font-weight-medium text-white text-body-1">Dashboard</v-list-item-title>
        </v-list-item>

        <!-- Address Space -->
        <v-list-item value="browser" rounded="lg" class="mb-1">
          <template v-slot:prepend>
            <v-icon icon="mdi-file-tree" color="grey-darken-1" size="22"></v-icon>
          </template>
          <v-list-item-title class="text-grey-darken-2 text-body-1">Address Space</v-list-item-title>
        </v-list-item>

        <!-- Monitored Items -->
        <v-list-item value="monitored" rounded="lg" class="mb-1">
          <template v-slot:prepend>
            <v-icon icon="mdi-chart-box-outline" color="grey-darken-1" size="22"></v-icon>
          </template>
          <v-list-item-title class="text-grey-darken-2 text-body-1">Monitored Items</v-list-item-title>
        </v-list-item>

        <v-list-subheader class="text-overline text-grey mt-4">Features</v-list-subheader>

        <!-- Events & Alarms -->
        <v-list-item value="events" rounded="lg" class="mb-1">
          <template v-slot:prepend>
            <v-icon icon="mdi-bell-alert-outline" color="grey-darken-1" size="22"></v-icon>
          </template>
          <v-list-item-title class="text-grey-darken-2 text-body-1">Events & Alarms</v-list-item-title>
        </v-list-item>

        <!-- Certificates -->
        <v-list-item value="certificates" rounded="lg" class="mb-1">
          <template v-slot:prepend>
            <v-icon icon="mdi-certificate-outline" color="grey-darken-1" size="22"></v-icon>
          </template>
          <v-list-item-title class="text-grey-darken-2 text-body-1">Certificates</v-list-item-title>
        </v-list-item>

        <v-list-subheader class="text-overline text-grey mt-4">System</v-list-subheader>

        <!-- Settings -->
        <v-list-item value="settings" rounded="lg" class="mb-1">
          <template v-slot:prepend>
            <v-icon icon="mdi-cog-outline" color="grey-darken-1" size="22"></v-icon>
          </template>
          <v-list-item-title class="text-grey-darken-2 text-body-1">Settings</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Top Header Bar (Minimal) -->
    <v-app-bar elevation="0" color="transparent" height="56">
      <v-btn icon="mdi-menu" variant="text" @click.stop="drawer = !drawer"></v-btn>
      
      <v-spacer></v-spacer>

      <v-avatar size="36" class="mr-4" color="primary">
        <span class="text-caption text-white font-weight-bold">OP</span>
      </v-avatar>
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <v-container fluid class="pa-6">
        <OpcUaDashboard />
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
