<script setup>
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  loadingNodes: {
    type: Set,
    required: true
  },
  selectedNodeId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['toggle', 'open-menu', 'select'])

const isSelected = computed(() => props.selectedNodeId === props.node.nodeId)

function onToggle() {
  emit('toggle', props.node)
}

function onContextMenu(event) {
  emit('open-menu', { event, node: props.node })
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
</script>

<template>
  <div class="tree-item-container">
    <v-list-item
        :value="node.nodeId"
        rounded="0"
        density="compact"
        :active="isSelected"
        color="primary"
        variant="flat"
        :class="{ 'bg-blue-grey-lighten-5': isSelected }"
        @click="emit('select', node)"
        @contextmenu.prevent="onContextMenu"
        class="tree-node py-0 min-h-32 mb-1"
        style="min-height: 32px;"
    >
        <template v-slot:prepend>
            <v-icon 
                v-if="node.nodeClass === 'Object' || node.nodeClass === 'Folder'" 
                size="20" 
                color="medium-emphasis"
                class="mr-1"
                @click.stop="onToggle"
            >
                {{ node.isExpanded ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
            </v-icon>
            <v-icon :color="getNodeColor(node.nodeClass)" size="22" class="mr-2">
                {{ getNodeIcon(node.nodeClass) }}
            </v-icon>
        </template>
        
        <v-list-item-title class="text-body-2 font-weight-medium">
            {{ node.displayName }}
        </v-list-item-title>
        <v-list-item-subtitle class="text-caption font-mono text-medium-emphasis" v-if="!node.isExpanded">
            {{ node.nodeId }}
        </v-list-item-subtitle>

        <template v-slot:append>
             <v-progress-circular 
                  v-if="loadingNodes.has(node.nodeId)" 
                  indeterminate 
                  size="16" 
                  width="2" 
                  color="primary"
              ></v-progress-circular>
        </template>
    </v-list-item>

    <div v-if="node.isExpanded" class="pl-3 ml-3 border-s">
        <div v-if="node.children.length === 0 && node.hasLoaded" class="text-caption text-grey pa-2 ml-4">Empty</div>
        <template v-for="child in node.children" :key="child.nodeId">
             <!-- Recursion! -->
             <TreeItem 
                :node="child" 
                :loading-nodes="loadingNodes" 
                :selected-node-id="selectedNodeId"
                @toggle="(n) => emit('toggle', n)"
                @select="(n) => emit('select', n)"
                @open-menu="(p) => emit('open-menu', p)"
             />
        </template>
    </div>
  </div>
</template>
