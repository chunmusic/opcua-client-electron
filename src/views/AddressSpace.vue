<script setup>
import { ref, onMounted } from 'vue'
import TreeItem from '../components/TreeItem.vue'
import ContextMenu from '../components/ContextMenu.vue'
import { opcuaStore } from '../stores/opcua.js'

// State
const rootNodes = ref([])
const expandedNodes = ref(new Set())
const loadingNodes = ref(new Set())
const selectedNode = ref(null)

// Context Menu State
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  node: null
})

function openContextMenu({ event, node }) {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    node: node
  }
}

function handleMenuAction({ action, node }) {
  if (action === 'monitor') {
    // Add to monitored items
    opcuaStore.state.monitoredItems.push({
      nodeId: node.nodeId,
      value: '---',
      dataType: node.dataType || 'Auto',
      timestamp: '---'
    })
    // Auto subscribe if connected
    if (opcuaStore.state.isConnected) {
        window.electronAPI.opcuaSubscribe([node.nodeId])
    }
  } else if (action === 'write') {
    // Set node and redirect
    opcuaStore.setNodeToWrite(node.nodeId)
    opcuaStore.setCurrentView('dashboard')
  } else if (action === 'copyId') {
    navigator.clipboard.writeText(node.nodeId)
  }
}

// Load root folder on mount
onMounted(async () => {
  await loadNode('RootFolder', rootNodes.value)
})

// Fetch children for a node
async function loadNode(nodeId, targetArray) {
  try {
    loadingNodes.value.add(nodeId)
    const references = await window.electronAPI.opcuaBrowse(nodeId)
    
    if (!Array.isArray(references)) {
        console.warn('Browse returned non-array:', references)
        return
    }

    // Sort: Folders/Objects first, then Variables
    references.sort((a, b) => {
      if (a.nodeClass === 'Object' && b.nodeClass !== 'Object') return -1
      if (a.nodeClass !== 'Object' && b.nodeClass === 'Object') return 1
      return a.displayName.localeCompare(b.displayName)
    })

    // Add UI state properties
    const nodes = references.map(ref => ({
      ...ref,
      children: [], // For recursion
      isExpanded: false,
      hasLoaded: false,
      level: 0 // Base level, will be adjusted by parent
    }))

    // If loading root, just set it
    if (nodeId === 'RootFolder') {
      rootNodes.value = nodes
    } else {
        // Validation check for target array
        targetArray.push(...nodes)
    }
  } catch (err) {
    console.error("Failed to browse:", err)
  } finally {
    loadingNodes.value.delete(nodeId)
  }
}

// Toggle expansion
async function toggleNode(node) {
  if (node.isExpanded) {
    node.isExpanded = false
  } else {
    node.isExpanded = true
    if (!node.hasLoaded) {
      await loadChildren(node)
      node.hasLoaded = true
    }
  }
}

function selectNode(node) {
    selectedNode.value = node
}

function collapseAll() {
    // Helper to recursively collapse
    const collapse = (nodes) => {
        nodes.forEach(n => {
            n.isExpanded = false
            if (n.children) collapse(n.children)
        })
    }
    collapse(rootNodes.value)
}

function getNodeIcon(nodeClass) {
  switch (nodeClass) {
    case 'Object': return 'mdi-folder-outline'
    case 'Variable': return 'mdi-tag-outline'
    case 'Method': return 'mdi-function-variant'
    default: return 'mdi-cube-outline'
  }
}

function getNodeColor(nodeClass) {
    switch (nodeClass) {
        case 'Object': return 'primary'
        case 'Variable': return 'teal'
        case 'Method': return 'orange'
        default: return 'grey'
    }
}

async function loadChildren(parentNode) {
    try {
        loadingNodes.value.add(parentNode.nodeId)
        const references = await window.electronAPI.opcuaBrowse(parentNode.nodeId)
        
        // Sort: Folders/Objects first, then Variables
        references.sort((a, b) => {
          if (a.nodeClass === 'Object' && b.nodeClass !== 'Object') return -1
          if (a.nodeClass !== 'Object' && b.nodeClass === 'Object') return 1
          return a.displayName.localeCompare(b.displayName)
        })

        const children = references.map(ref => ({
            ...ref,
            children: [],
            isExpanded: false,
            hasLoaded: false,
            level: parentNode.level + 1
        }))
        
        parentNode.children = children
    } catch (err) {
        console.error("Browse error:", err)
    } finally {
        loadingNodes.value.delete(parentNode.nodeId)
    }
}
</script>

<template>
  <v-container fluid class="pa-0 fill-height align-start">
    <v-card class="w-100 fill-height rounded-xl d-flex flex-column" elevation="0" style="box-shadow: 0 1px 4px rgba(0,0,0,0.05) !important;">
      <!-- Header -->
      <v-card-title class="pa-4 d-flex align-center border-b" style="height: 72px;">
        <v-icon color="primary" class="mr-3">mdi-file-tree</v-icon>
        <span class="text-h6 font-weight-bold">Address Space</span>
        <v-spacer></v-spacer>
        <v-chip v-if="!opcuaStore.state.isConnected" color="warning" size="small" class="mr-2">Disconnected</v-chip>
        <v-btn icon="mdi-refresh" variant="text" color="medium-emphasis" size="small" @click="loadNode('RootFolder', rootNodes = [])"></v-btn>
      </v-card-title>

      <!-- Disconnected State -->
      <div v-if="!opcuaStore.state.isConnected" class="d-flex flex-column align-center justify-center fill-height text-center text-medium-emphasis">
        <v-icon size="64" color="surface-variant" class="mb-6 mt-8">mdi-lan-disconnect</v-icon>
        <div class="text-h6 font-weight-bold mb-2">Not Connected</div>
        <div class="text-body-1 mb-6">Connect to an OPC UA server to browse nodes.</div>
        <v-btn color="primary" rounded="lg" class="mb-8" @click="opcuaStore.setCurrentView('dashboard')">Go to Dashboard</v-btn>
      </div>

      <!-- Browser Content Split View -->
      <v-card-text v-else class="flex-grow-1 pa-0 overflow-hidden" style="height: 100%;">
          <v-row no-gutters class="fill-height">
              <!-- Left Pane: Tree View -->
              <v-col cols="4" class="fill-height border-e d-flex flex-column opc-tree-container">
                  <div class="pa-2 d-flex justify-space-between align-center bg-grey-lighten-5 border-b">
                      <span class="text-caption font-weight-bold text-medium-emphasis text-uppercase pl-2">Browser</span>
                      <v-btn size="x-small" variant="text" icon="mdi-collapse-all-outline" @click="collapseAll"></v-btn>
                  </div>
                <v-list density="compact" nav class="pa-0 flex-grow-1 overflow-y-auto" style="height: 0;">
                    <template v-for="node in rootNodes" :key="node.nodeId">
                        <TreeItem 
                            :node="node" 
                            :loading-nodes="loadingNodes" 
                            :selected-node-id="selectedNode?.nodeId"
                            @toggle="toggleNode"
                            @select="selectNode"
                            @open-menu="openContextMenu"
                        />
                    </template>
                </v-list>
              </v-col>

              <!-- Right Pane: Attributes -->
              <v-col cols="8" class="fill-height bg-surface d-flex flex-column">
                  <div v-if="selectedNode" class="d-flex flex-column fill-height">
                      <!-- Toolbar -->
                      <div class="pa-4 border-b d-flex align-center bg-white" style="height: 72px;"> 
                          <v-avatar :color="getNodeColor(selectedNode.nodeClass)" variant="tonal" rounded="lg" class="mr-4">
                              <v-icon>{{ getNodeIcon(selectedNode.nodeClass) }}</v-icon>
                          </v-avatar>
                          <div>
                              <div class="text-caption text-medium-emphasis font-weight-bold">{{ selectedNode.nodeClass }}</div>
                              <div class="text-h6 font-weight-bold">{{ selectedNode.displayName }}</div>
                          </div>
                      </div>
                      
                      <!-- Attributes Grid -->
                      <div class="pa-6 overflow-y-auto flex-grow-1">
                          <v-table density="comfortable" class="border rounded-lg">
                              <tbody>
                                  <tr>
                                      <td class="text-medium-emphasis font-weight-medium" style="width: 140px;">Node ID</td>
                                      <td class="font-mono text-body-2">{{ selectedNode.nodeId }}</td>
                                  </tr>
                                  <tr>
                                      <td class="text-medium-emphasis font-weight-medium">Browse Name</td>
                                      <td class="text-body-2">{{ selectedNode.browseName }}</td>
                                  </tr>
                                  <tr>
                                      <td class="text-medium-emphasis font-weight-medium">Type Definition</td>
                                      <td class="text-body-2">{{ selectedNode.typeDefinition }}</td>
                                  </tr>
                                  <tr v-if="selectedNode.dataType">
                                      <td class="text-medium-emphasis font-weight-medium">Data Type</td>
                                      <td class="text-body-2 text-primary font-weight-bold">{{ selectedNode.dataType }}</td>
                                  </tr>
                                   <tr v-if="selectedNode.description">
                                      <td class="text-medium-emphasis font-weight-medium">Description</td>
                                      <td class="text-body-2 text-medium-emphasis">{{ selectedNode.description?.text || '---' }}</td>
                                  </tr>
                              </tbody>
                          </v-table>

                          <!-- Actions -->
                          <div class="mt-6 d-flex gap-4">
                              <v-btn 
                                  v-if="selectedNode.nodeClass === 'Variable'"
                                  prepend-icon="mdi-chart-box-plus-outline" 
                                  color="primary" 
                                  class="mr-2"
                                  @click="handleMenuAction({ action: 'monitor', node: selectedNode })"
                              >
                                  Monitor Item
                              </v-btn>
                               <v-btn 
                                  v-if="selectedNode.nodeClass === 'Variable'"
                                  prepend-icon="mdi-pencil-box-outline" 
                                  variant="tonal" 
                                  color="secondary"
                                  class="mr-2"
                                  @click="handleMenuAction({ action: 'write', node: selectedNode })"
                              >
                                  Write Value
                              </v-btn>
                              <v-btn 
                                  prepend-icon="mdi-content-copy" 
                                  variant="outlined" 
                                  color="medium-emphasis"
                                  @click="handleMenuAction({ action: 'copyId', node: selectedNode })"
                              >
                                  Copy ID
                              </v-btn>
                          </div>
                      </div>
                  </div>
                  
                  <div v-else class="fill-height d-flex flex-column align-center justify-center text-medium-emphasis">
                       <v-icon size="64" color="surface-variant" class="mb-4 opc-watermark">mdi-cursor-default-click-outline</v-icon>
                       <div class="text-h6">No Node Selected</div>
                       <div class="text-body-2">Select a node from the browser to view details</div>
                  </div>
              </v-col>
          </v-row>
      </v-card-text>
    </v-card>
    
    <ContextMenu
      v-model="contextMenu.visible"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :node="contextMenu.node"
      @action="handleMenuAction"
    />
  </v-container>
</template>
