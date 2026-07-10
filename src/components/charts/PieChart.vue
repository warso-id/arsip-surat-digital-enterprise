<template>
  <div class="pie-chart-wrapper" :style="{ height: height + 'px' }">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

export default {
  name: 'PieChart',
  props: {
    data: { type: Object, required: true },
    height: { type: Number, default: 300 },
    type: { type: String, default: 'doughnut', validator: v => ['pie', 'doughnut', 'polarArea'].includes(v) }
  },
  setup(props) {
    const chartCanvas = ref(null)
    let chartInstance = null
    
    const createChart = () => {
      if (!chartCanvas.value || !props.data) return
      
      if (chartInstance) {
        chartInstance.destroy()
      }
      
      const ctx = chartCanvas.value.getContext('2d')
      
      const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 16,
              font: { size: 11 }
            }
          }
        }
      }
      
      chartInstance = new Chart(ctx, {
        type: props.type,
        data: {
          labels: props.data.labels || [],
          datasets: [{
            data: props.data.values || [],
            backgroundColor: [
              '#1976D2', '#4CAF50', '#FF9800', '#F44336',
              '#9C27B0', '#00BCD4', '#FF5722', '#607D8B',
              '#E91E63', '#3F51B5', '#009688', '#795548'
            ],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: defaultOptions
      })
    }
    
    watch(() => props.data, () => createChart(), { deep: true })
    
    onMounted(() => createChart())
    
    onUnmounted(() => {
      if (chartInstance) chartInstance.destroy()
    })
    
    return { chartCanvas }
  }
}
</script>

<style lang="scss" scoped>
.pie-chart-wrapper {
  position: relative;
  width: 100%;
  
  canvas {
    width: 100% !important;
  }
}
</style>
