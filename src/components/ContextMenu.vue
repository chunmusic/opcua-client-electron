<script setup>
import { defineProps, defineEmits, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: Boolean, // Visible state
  x: Number,
  y: Number,
  node: Object // Context data
})

const emit = defineEmits(['update:modelValue', 'action'])

function close() {
  emit('update:modelValue', false)
}

function handleAction(action) {
  emit('action', { action, node: props.node })
  close()
}

// Close on outside click
function onWindowClick() {
  if (props.modelValue) close()
}

onMounted(() => window.addEventListener('click', onWindowClick))
onUnmounted(() => window.removeEventListener('click', onWindowClick))
</script>

<template>
  <v-menu
    :model-value="modelValue"
    :style="{ top: `${y}px`, left: `${x}px`, position: 'absolute' }"
    absolute
    offset-y
    :close-on-content-click="true"
  >
    <v-list density="compact" rounded="lg" elevation="4" class="py-0">
      <v-list-item v-if="node?.nodeClass === 'Variable'" @click="handleAction('monitor')" link>
        <template v-slot:prepend>
          <v-icon icon="mdi-chart-box-plus-outline" color="primary" size="small" class="mr-2"></v-icon>
        </template>
        <v-list-item-title>Monitor Item</v-list-item-title>
      </v-list-item>

      <v-list-item v-if="node?.nodeClass === 'Variable'" @click="handleAction('write')" link>
        <template v-slot:prepend>
          <v-icon icon="mdi-pencil-outline" color="secondary" size="small" class="mr-2"></v-icon>
        </template>
        <v-list-item-title>Write Value</v-list-item-title>
      </v-list-item>

      <v-divider v-if="node?.nodeClass === 'Variable'"></v-divider>

      <v-list-item @click="handleAction('copyId')" link>
        <template v-slot:prepend>
          <v-icon icon="mdi-content-copy" color="medium-emphasis" size="small" class="mr-2"></v-icon>
        </template>
        <v-list-item-title>Copy Node ID</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
