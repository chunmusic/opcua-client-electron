<template>
  <v-container fluid class="pa-0 fill-height align-start">
    <v-card class="w-100 fill-height rounded-xl d-flex flex-column" elevation="0" style="box-shadow: 0 1px 4px rgba(0,0,0,0.05) !important;">
      
      <v-card-title class="pa-4 d-flex align-center border-b" style="height: 72px;">
        <v-icon size="32" color="grey-darken-2" class="mr-3">mdi-certificate-outline</v-icon>
        <span class="text-h6 font-weight-bold">Certificate Management</span>
        <v-spacer></v-spacer>
        <v-btn variant="text" color="primary" icon="mdi-refresh" @click="fetchCertificates" :loading="loading"></v-btn>
      </v-card-title>

      <v-tabs v-model="tab" color="primary" grow>
        <v-tab value="trusted">Trusted ({{ certificates.trusted.length }})</v-tab>
        <v-tab value="rejected">Rejected ({{ certificates.rejected.length }})</v-tab>
        <v-tab value="own">My Certificate ({{ certificates.own.length }})</v-tab>
      </v-tabs>

      <v-data-table
        :headers="headers"
        :items="currentItems"
        :loading="loading"
        density="comfortable"
        hover
        class="flex-grow-1"
      >
        <template v-slot:item.validFrom="{ item }">
          {{ new Date(item.validFrom).toLocaleDateString() }}
        </template>
        <template v-slot:item.validTo="{ item }">
          {{ new Date(item.validTo).toLocaleDateString() }}
        </template>
        <template v-slot:item.thumbprint="{ item }">
          <code class="bg-grey-lighten-4 pa-1 rounded text-caption">{{ item.thumbprint.substring(0, 20) }}...</code>
        </template>
        
        <template v-slot:item.actions="{ item }">
          <div class="d-flex justify-end gap-2">
            <v-btn 
              v-if="tab === 'rejected'"
              color="success" 
              size="small" 
              variant="flat" 
              prepend-icon="mdi-check-decagram"
              @click="trustCertificate(item)"
            >
              Trust
            </v-btn>

            <v-btn 
              v-if="tab === 'trusted'"
              color="warning" 
              size="small" 
              variant="text" 
              prepend-icon="mdi-alert-octagon-outline"
              @click="rejectCertificate(item)"
            >
              Reject
            </v-btn>

            <v-btn 
              color="error" 
              size="small" 
              variant="text" 
              icon="mdi-delete-outline"
              @click="deleteCertificate(item, tab)"
            ></v-btn>
          </div>
        </template>
      </v-data-table>

    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const tab = ref('trusted');
const loading = ref(false);
const certificates = ref({
    trusted: [],
    rejected: [],
    own: []
});

const currentItems = computed(() => {
    return certificates.value[tab.value] || [];
});

const headers = [
    { title: 'Subject', key: 'subject', align: 'center', headerProps: { class: 'font-weight-bold text-center justify-center' } },
    { title: 'Thumbprint', key: 'thumbprint', align: 'center', sortable: false, headerProps: { class: 'font-weight-bold text-center justify-center' } },
    { title: 'Valid From', key: 'validFrom', align: 'center', headerProps: { class: 'font-weight-bold text-center justify-center' } },
    { title: 'Expires', key: 'validTo', align: 'center', headerProps: { class: 'font-weight-bold text-center justify-center' } },
    { title: 'Actions', key: 'actions', align: 'center', sortable: false, headerProps: { class: 'font-weight-bold text-center justify-center' } },
];

const fetchCertificates = async () => {
    loading.value = true;
    try {
        certificates.value = await window.ipcRenderer.invoke('opcua:get-certificates');
    } catch (error) {
        console.error("Failed to fetch certificates:", error);
    } finally {
        loading.value = false;
    }
};

const trustCertificate = async (cert) => {
    try {
        await window.ipcRenderer.invoke('opcua:trust-certificate', { filename: cert.filename });
        await fetchCertificates();
    } catch (error) {
        console.error("Trust failed:", error);
    }
};

const rejectCertificate = async (cert) => {
    try {
        await window.ipcRenderer.invoke('opcua:reject-certificate', { filename: cert.filename });
        await fetchCertificates();
    } catch (error) {
        console.error("Reject failed:", error);
    }
};

const deleteCertificate = async (cert, status) => {
    if (!confirm(`Are you sure you want to delete this certificate?`)) return;
    try {
        await window.ipcRenderer.invoke('opcua:delete-certificate', { filename: cert.filename, status });
        await fetchCertificates();
    } catch (error) {
        console.error("Delete failed:", error);
    }
};

onMounted(() => {
    fetchCertificates();
});
</script>

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
