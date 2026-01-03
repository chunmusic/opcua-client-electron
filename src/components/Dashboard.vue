<script setup>
import { ref } from 'vue'

const items = ref([
  { title: 'System Status', value: 'Online', icon: '🟢' },
  { title: 'CPU Usage', value: '12%', icon: '⚡' },
  { title: 'Memory', value: '3.4 GB', icon: '💾' },
  { title: 'Network', value: '1.2 Gbps', icon: '🌐' },
])

const logs = ref([
  { time: '10:00:01', msg: 'System initialized' },
  { time: '10:00:05', msg: 'Connected to server' },
  { time: '10:01:20', msg: 'Data sync completed' },
])
</script>

<template>
  <div class="dashboard">
    <div class="grid">
      <div v-for="(item, index) in items" :key="index" class="stat-card glass">
        <div class="icon">{{ item.icon }}</div>
        <div class="info">
          <h3>{{ item.title }}</h3>
          <p>{{ item.value }}</p>
        </div>
      </div>
    </div>

    <div class="content glass">
      <h2>Activity Log</h2>
      <ul class="log-list">
        <li v-for="(log, i) in logs" :key="i">
          <span class="time">{{ log.time }}</span>
          <span class="msg">{{ log.msg }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.08);
}

.icon {
  font-size: 2.5rem;
}

.info h3 {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.info p {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.content {
  padding: 2rem;
  text-align: left;
}

.log-list {
  list-style: none;
  padding: 0;
  margin-top: 1rem;
}

.log-list li {
  display: flex;
  justify-content: space-between;
  padding: 0.8rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.log-list li:last-child {
  border-bottom: none;
}

.time {
  font-family: monospace;
  opacity: 0.6;
}

h2 {
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
  margin-top: 0;
}
</style>
