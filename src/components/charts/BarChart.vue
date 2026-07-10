<template>
  <div class="bar-chart-wrapper" :style="{ height: height + 'px' }">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

export default {
  name: 'BarChart',
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
              padding: 20,
              font: { size: 12 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
            titleFont: { size: 13 },
            bodyFont: { size: 12 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              font: { size: 11 }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            ticks: {
              font: { size: 11 }
            },
            grid: {
              display: false
            }
          }
        },
        ...props.options
      }
      
      chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: props.data.labels || [],
          datasets: (props.data.datasets || []).map(ds => ({
            ...ds,
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.7,
            categoryPercentage: 0.8
          }))
        },
        options: defaultOptions
      })
    }
    
    watch(() => props.data, () => {
      createChart()
    }, { deep: true })
    
    onMounted(() => {
      createChart()
    })
    
    onUnmounted(() => {
      if (chartInstance) {
        chartInstance.destroy()
      }
    })
    
    return { chartCanvas }
  }
}
</script>

<style lang="scss" scoped>
.bar-chart-wrapper {
  position: relative;
  width: 100%;
  
  canvas {
    width: 100% !important;
  }
}
</style>
