<template>
  <div class="line-chart-wrapper" :style="{ height: height + 'px' }">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

export default {
  name: 'LineChart',
  props: {
    data: { type: Object, required: true },
    height: { type: Number, default: 300 },
    options: { type: Object, default: () => ({}) }
  },
  setup(props) {
    const chartCanvas = ref(null)
    let chartInstance = null
    
    const createChart = () => {
      if (!chartCanvas.value || !props.data) return
      
      if (chartInstance) chartInstance.destroy()
      
      const ctx = chartCanvas.value.getContext('2d')
      
      const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: { size: 12 }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { font: { size: 11 } },
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          x: {
            ticks: { font: { size: 11 } },
            grid: { display: false }
          }
        },
        elements: {
          line: { tension: 0.4 },
          point: { radius: 4, hoverRadius: 6 }
        },
        ...props.options
      }
      
      chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: props.data.labels || [],
          datasets: (props.data.datasets || []).map(ds => ({
            ...ds,
            fill: ds.fill || false,
            borderWidth: 2
          }))
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
.line-chart-wrapper {
  position: relative;
  width: 100%;
  
  canvas {
    width: 100% !important;
  }
}
</style>
