/**
 * ============================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.1.0 (2026)
 * Chart Module - GRAND MASTER FINAL
 * ============================================
 */

class ChartManager {
  constructor() {
    this.charts = {};
    this.colors = { primary:'#1976D2', success:'#4CAF50', warning:'#FF9800', danger:'#F44336', info:'#2196F3', purple:'#9C27B0', teal:'#009688', ai:'#667eea', orange:'#F7931A' };
  }

  createBarChart(id, data) {
    const ctx = document.getElementById(id)?.getContext('2d'); if (!ctx) return null;
    this.destroy(id);
    this.charts[id] = new Chart(ctx, {
      type:'bar', data:{ labels:data.labels||[], datasets:[ { label:'Surat Masuk', data:data.suratMasuk||[], backgroundColor:this.hexa(this.colors.primary,0.7), borderColor:this.colors.primary, borderWidth:1, borderRadius:6 }, { label:'Surat Keluar', data:data.suratKeluar||[], backgroundColor:this.hexa(this.colors.success,0.7), borderColor:this.colors.success, borderWidth:1, borderRadius:6 } ] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ usePointStyle:true, padding:20 } } }, scales:{ y:{ beginAtZero:true, grid:{ color:'rgba(0,0,0,0.05)' } }, x:{ grid:{ display:false } } } }
    });
    return this.charts[id];
  }

  createPieChart(id, data) {
    const ctx = document.getElementById(id)?.getContext('2d'); if (!ctx) return null;
    this.destroy(id);
    this.charts[id] = new Chart(ctx, {
      type:'doughnut', data:{ labels:data.labels||[], datasets:[{ data:data.values||[], backgroundColor:[this.hexa(this.colors.info,0.8),this.hexa(this.colors.warning,0.8),this.hexa(this.colors.purple,0.8),this.hexa(this.colors.success,0.8)], borderColor:'#fff', borderWidth:2 }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ usePointStyle:true, padding:15 } } }, cutout:'60%' }
    });
    return this.charts[id];
  }

  createLineChart(id, data) {
    const ctx = document.getElementById(id)?.getContext('2d'); if (!ctx) return null;
    this.destroy(id);
    this.charts[id] = new Chart(ctx, {
      type:'line', data:{ labels:data.labels||[], datasets:[ { label:'Surat Masuk', data:data.suratMasuk||[], borderColor:this.colors.primary, backgroundColor:this.hexa(this.colors.primary,0.1), fill:true, tension:0.4, pointRadius:4 }, { label:'Surat Keluar', data:data.suratKeluar||[], borderColor:this.colors.success, backgroundColor:this.hexa(this.colors.success,0.1), fill:true, tension:0.4, pointRadius:4 } ] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ usePointStyle:true, padding:20 } } }, scales:{ y:{ beginAtZero:true, grid:{ color:'rgba(0,0,0,0.05)' } }, x:{ grid:{ display:false } } } }
    });
    return this.charts[id];
  }

  createAIPredictiveChart(id, data) {
    const ctx = document.getElementById(id)?.getContext('2d'); if (!ctx) return null;
    this.destroy(id);
    const hist = data.historical||[], preds = data.predictions||[];
    this.charts[id] = new Chart(ctx, {
      type:'line', data:{ labels:[...(data.historicalLabels||[]),...preds.map(p=>p.month)], datasets:[
        { label:'Historis', data:[...hist,...Array(preds.length).fill(null)], borderColor:this.colors.primary, backgroundColor:this.hexa(this.colors.primary,0.1), fill:true, tension:0.4, pointRadius:4 },
        { label:'🤖 AI Predict', data:[...Array(hist.length).fill(null),...preds.map(p=>p.predicted)], borderColor:this.colors.ai, backgroundColor:this.hexa(this.colors.ai,0.1), borderDash:[5,5], fill:true, tension:0.4, pointRadius:5, pointStyle:'star' },
        { label:'Upper', data:[...Array(hist.length).fill(null),...preds.map(p=>p.upperBound)], borderColor:'transparent', backgroundColor:this.hexa(this.colors.ai,0.05), fill:'+1', pointRadius:0, borderWidth:0 },
        { label:'Lower', data:[...Array(hist.length).fill(null),...preds.map(p=>p.lowerBound)], borderColor:'transparent', backgroundColor:this.hexa(this.colors.ai,0.05), fill:false, pointRadius:0, borderWidth:0 }
      ] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ usePointStyle:true, padding:20, filter:(i)=>!i.text.includes('Upper')&&!i.text.includes('Lower') } } }, scales:{ y:{ beginAtZero:false, grid:{ color:'rgba(0,0,0,0.05)' } }, x:{ grid:{ display:false } } } }
    });
    return this.charts[id];
  }

  createMonthlyTrendChart(id, data) {
    const ctx = document.getElementById(id)?.getContext('2d'); if (!ctx) return null;
    this.destroy(id);
    const grad = ctx.createLinearGradient(0,0,0,400); grad.addColorStop(0,this.hexa(this.colors.primary,0.4)); grad.addColorStop(1,this.hexa(this.colors.primary,0));
    this.charts[id] = new Chart(ctx, {
      type:'line', data:{ labels:data.labels||[], datasets:[{ label:'Total', data:data.values||[], borderColor:this.colors.primary, backgroundColor:grad, fill:true, tension:0.4, pointRadius:3, borderWidth:2 }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:false, grid:{ color:'rgba(0,0,0,0.05)' } }, x:{ grid:{ display:false } } } }
    });
    return this.charts[id];
  }

  async updateFromAPI(chartType, id, endpoint) {
    try {
      const r = await APP.api.get(endpoint);
      const actions = { bar: ()=>this.createBarChart(id, r.data), pie: ()=>this.createPieChart(id, r.data), line: ()=>this.createLineChart(id, r.data), ai: ()=>this.createAIPredictiveChart(id, r.data), monthly: ()=>this.createMonthlyTrendChart(id, r.data) };
      if (actions[chartType]) actions[chartType]();
    } catch(e) { console.warn('Chart update failed:', e.message); }
  }

  destroy(id) { if (this.charts[id]) { this.charts[id].destroy(); delete this.charts[id]; } }
  destroyAll() { Object.keys(this.charts).forEach(k => this.charts[k].destroy()); this.charts = {}; }
  resizeAll() { Object.values(this.charts).forEach(c => c.resize()); }
  hexa(hex, a=1) { const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; }
}

const chartManager = new ChartManager();

function initDashboardCharts() {
  console.log('📊 Charts v3.1.0 initializing...');
  chartManager.createBarChart('surat-bar-chart', { labels:['Jan','Feb','Mar','Apr','Mei','Jun'], suratMasuk:[45,38,42,50,48,55], suratKeluar:[30,25,28,35,32,40] });
  chartManager.createPieChart('status-pie-chart', { labels:['Diterima','Disposisi','Proses','Selesai'], values:[30,25,20,50] });
  chartManager.createLineChart('trend-line-chart', { labels:['Mg1','Mg2','Mg3','Mg4'], suratMasuk:[12,15,10,18], suratKeluar:[8,10,7,12] });
  chartManager.createAIPredictiveChart('ai-predictive-chart', { historical:[45,38,42,50,48,55], historicalLabels:['Jan','Feb','Mar','Apr','Mei','Jun'], predictions:[{month:'Jul',predicted:52,confidence:85,lowerBound:42,upperBound:62},{month:'Ags',predicted:48,confidence:80,lowerBound:38,upperBound:58},{month:'Sep',predicted:55,confidence:75,lowerBound:45,upperBound:65}] });
  chartManager.createMonthlyTrendChart('monthly-trend-chart');
  loadDashboardData();
}

async function loadDashboardData() {
  try {
    const [stats, chart] = await Promise.all([APP.api.get('dashboard.stats'), APP.api.get('dashboard.chart', { tahun: new Date().getFullYear() })]);
    if (chart.data) chartManager.createMonthlyTrendChart('monthly-trend-chart', { labels: chart.data.labels, values: (chart.data.suratMasuk||[]).map((v,i) => v + (chart.data.suratKeluar?.[i]||0)) });
    try { const ai = await APP.api.get('ai.predictTrend', { months: 3 }); if (ai.data) chartManager.createAIPredictiveChart('ai-predictive-chart', { historical: ai.data.historical||[], predictions: ai.data.predictions||[] }); } catch(e) {}
  } catch(e) { console.warn('Using default chart data:', e.message); }
}

window.addEventListener('resize', () => { clearTimeout(window._chartResize); window._chartResize = setTimeout(() => chartManager.resizeAll(), 250); });

window.chartManager = chartManager;
window.initDashboardCharts = initDashboardCharts;
console.log('✅ chart-init.js v3.1.0 GRAND MASTER FINAL loaded');