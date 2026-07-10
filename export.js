/**
 * ============================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.1.0 (2026)
 * Export Module - GRAND MASTER FINAL
 * ============================================
 */

class ExportManager {
  constructor() { console.log('📤 Export v3.1.0 | CSV:✅ JSON:✅ Excel:✅ PDF:✅ Print:✅'); }

  exportCSV(data, filename = 'export.csv', opts = {}) {
    if (!data?.length) { APP.ui.toast('No data', 'warning'); return false; }
    try {
      const keys = opts.headers || Object.keys(data[0]);
      const rows = [keys.join(opts.delimiter || ',')];
      data.forEach(r => rows.push(keys.map(k => { let v = r[k]; if (v instanceof Date) v = v.toLocaleDateString('id-ID'); if (typeof v === 'object') v = JSON.stringify(v); v = String(v??''); return (opts.quoteStrings !== false && (v.includes(',')||v.includes('"')||v.includes('\n'))) ? '"'+v.replace(/"/g,'""')+'"' : v; }).join(opts.delimiter || ',')));
      this.download((opts.includeBOM !== false ? '\uFEFF' : '') + rows.join('\n'), filename, 'text/csv;charset=utf-8;');
      APP.ui.toast('CSV exported: ' + filename, 'success'); return true;
    } catch(e) { APP.ui.toast('CSV failed: ' + e.message, 'error'); return false; }
  }

  exportJSON(data, filename = 'export.json', opts = {}) {
    if (!data) { APP.ui.toast('No data', 'warning'); return false; }
    try {
      const out = opts.includeMetadata !== false ? { metadata: { version:'3.1.0', exportedAt: new Date().toISOString(), totalRecords: Array.isArray(data)?data.length:1, by: APP.user?.username }, data } : data;
      this.download(JSON.stringify(out, null, opts.pretty !== false ? 2 : 0), filename, 'application/json');
      APP.ui.toast('JSON exported: ' + filename, 'success'); return true;
    } catch(e) { APP.ui.toast('JSON failed: ' + e.message, 'error'); return false; }
  }

  exportExcel(data, filename = 'export.xlsx', opts = {}) {
    if (!data?.length) { APP.ui.toast('No data', 'warning'); return false; }
    if (typeof XLSX === 'undefined') return this.exportCSV(data, filename.replace('.xlsx','.csv'), opts);
    try {
      const wb = XLSX.utils.book_new();
      if (opts.includeMetadata !== false) { const ms = XLSX.utils.aoa_to_sheet([['Export v3.1.0'],['At',new Date().toLocaleString('id-ID')],['Records',data.length],['By',APP.user?.username]]); XLSX.utils.book_append_sheet(wb, ms, 'Metadata'); }
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = Object.keys(data[0]||{}).map(k => ({ wch: Math.max(k.length, ...data.map(r => String(r[k]||'').length)) }));
      XLSX.utils.book_append_sheet(wb, ws, opts.sheetName || 'Data');
      XLSX.writeFile(wb, filename);
      APP.ui.toast('Excel exported: ' + filename, 'success'); return true;
    } catch(e) { APP.ui.toast('Excel failed: ' + e.message, 'error'); return false; }
  }

  async exportPDF(data, title = 'Laporan', filename = 'export.pdf', opts = {}) {
    if (!data?.length) { APP.ui.toast('No data', 'warning'); return false; }
    if (typeof window.jspdf === 'undefined') return this.print(data, title);
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: opts.landscape?'landscape':'portrait', format: opts.format||'a4' });
      let y = 20;
      doc.setFontSize(16); doc.setTextColor(25,118,210); doc.text(title, 14, y); y += 10;
      doc.setFontSize(8); doc.setTextColor(100); doc.text(`v3.1.0 | ${new Date().toLocaleString('id-ID')} | ${APP.user?.username}`, 14, y); y += 8;
      doc.setDrawColor(200); doc.line(14, y, doc.internal.pageSize.width-14, y); y += 6;
      const headers = Object.keys(data[0]);
      doc.autoTable({ head: [headers], body: data.map(r => headers.map(h => { const v = r[h]; return v instanceof Date ? v.toLocaleDateString('id-ID') : typeof v === 'object' ? JSON.stringify(v) : String(v??''); })), startY: y, styles: { fontSize: opts.fontSize||9, cellPadding: 2 }, headStyles: { fillColor: [25,118,210], textColor: 255, fontStyle: 'bold' }, alternateRowStyles: { fillColor: [245,245,245] }, margin: { left:14, right:14 } });
      doc.save(filename);
      APP.ui.toast('PDF exported: ' + filename, 'success'); return true;
    } catch(e) { APP.ui.toast('PDF failed: ' + e.message, 'error'); return false; }
  }

  print(data, title = 'Laporan') {
    if (!data?.length) { APP.ui.toast('No data', 'warning'); return false; }
    const w = window.open('', '_blank', 'width=900,height=700');
    const headers = Object.keys(data[0]);
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#333}.header{text-align:center;border-bottom:2px solid #1976D2;padding-bottom:15px;margin-bottom:20px}.header h1{color:#1976D2;font-size:20px}.header p{color:#666;font-size:11px}table{width:100%;border-collapse:collapse;font-size:11px}th{background:#1976D2;color:white;padding:10px 8px;text-align:left}td{padding:8px;border-bottom:1px solid #eee}tr:nth-child(even){background:#f9f9f9}.footer{margin-top:20px;text-align:center;font-size:9px;color:#999;border-top:1px solid #eee;padding-top:10px}@media print{body{padding:0}@page{margin:15mm}}</style></head><body><div class="header"><h1>${title}</h1><p>v3.1.0 | ${new Date().toLocaleString('id-ID')} | ${data.length} records | ${APP.user?.username}</p></div><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${data.map(r=>`<tr>${headers.map(h=>`<td>${r[h] instanceof Date?r[h].toLocaleDateString('id-ID'):typeof r[h]==='object'?JSON.stringify(r[h]):String(r[h]??'-')}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="footer">Arsip Surat Digital Enterprise v3.1.0 | Generated automatically</div><script>window.onload=function(){window.print()}</script></body></html>`);
    w.document.close(); return true;
  }

  async copyToClipboard(data, format = 'json') {
    try {
      let content = format === 'json' ? JSON.stringify(data,null,2) : format === 'csv' && data?.length ? [Object.keys(data[0]).join(','), ...data.map(r=>Object.keys(data[0]).map(k=>{const v=r[k];return v?`"${String(v).replace(/"/g,'""')}"`:''}).join(','))].join('\n') : String(data);
      await navigator.clipboard.writeText(content);
      APP.ui.toast('Copied!', 'success'); return true;
    } catch(e) {
      const ta = document.createElement('textarea'); ta.value = typeof data==='object'?JSON.stringify(data):String(data); ta.style.cssText='position:fixed;opacity:0;'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      APP.ui.toast('Copied!', 'success'); return true;
    }
  }

  async share(data) {
    if (!navigator.share) { APP.ui.toast('Not supported', 'warning'); return false; }
    try { await navigator.share({ title: data.title, text: data.text, url: data.url, ...(data.files?.length && { files: data.files }) }); APP.ui.toast('Shared!', 'success'); return true; } catch(e) { if (e.name !== 'AbortError') APP.ui.toast('Failed', 'error'); return false; }
  }

  async exportModule(module, format = 'excel') {
    try {
      APP.ui.loading(true);
      let data, title, fn;
      const ds = this.getDateString();
      switch (module) {
        case 'surat-masuk': const sm = await APP.api.get('suratMasuk.list',{limit:1000}); data = sm.data?.items||[]; title='Surat Masuk'; fn=`surat_masuk_${ds}`; break;
        case 'surat-keluar': const sk = await APP.api.get('suratKeluar.list',{limit:1000}); data = sk.data?.items||[]; title='Surat Keluar'; fn=`surat_keluar_${ds}`; break;
        case 'disposisi': const d = await APP.api.get('disposisi.list'); data = d.data?.items||[]; title='Disposisi'; fn=`disposisi_${ds}`; break;
        case 'approval': const a = await APP.api.get('approval.list'); data = a.data?.items||[]; title='Approval'; fn=`approval_${ds}`; break;
        case 'audit-log': const l = await APP.api.get('auditLog.list',{limit:1000}); data = l.data?.items||[]; title='Audit Log'; fn=`audit_log_${ds}`; break;
        case 'all': const all = await APP.api.get('export.all'); if (all.data?.url) window.open(all.data.url,'_blank'); APP.ui.loading(false); APP.ui.toast('Exported!','success'); return true;
        default: APP.ui.loading(false); return false;
      }
      APP.ui.loading(false);
      const actions = { csv: ()=>this.exportCSV(data,fn+'.csv'), json: ()=>this.exportJSON(data,fn+'.json'), excel: ()=>this.exportExcel(data,fn+'.xlsx'), pdf: ()=>this.exportPDF(data,title,fn+'.pdf'), print: ()=>this.print(data,title) };
      return actions[format] ? actions[format]() : actions.excel();
    } catch(e) { APP.ui.loading(false); APP.ui.toast('Failed: '+e.message,'error'); return false; }
  }

  showExportDialog(data, title = 'Export') {
    const formats = [{id:'excel',name:'📊 Excel',icon:'table'},{id:'csv',name:'📄 CSV',icon:'description'},{id:'json',name:'📋 JSON',icon:'code'},{id:'pdf',name:'📕 PDF',icon:'picture_as_pdf'},{id:'print',name:'🖨️ Print',icon:'print'},{id:'clipboard',name:'📋 Copy',icon:'content_copy'}];
    window._expData = data; window._expTitle = title;
    window._expAction = (f) => { const d=window._expData,t=window._expTitle; f==='csv'?this.exportCSV(d,`${t}_${this.getDateString()}.csv`):f==='json'?this.exportJSON(d,`${t}_${this.getDateString()}.json`):f==='excel'?this.exportExcel(d,`${t}_${this.getDateString()}.xlsx`):f==='pdf'?this.exportPDF(d,t,`${t}_${this.getDateString()}.pdf`):f==='print'?this.print(d,t):this.copyToClipboard(d,'table'); document.querySelector('.modal-overlay')?.remove(); };
    APP.ui.showModal(title, `<p style="margin-bottom:12px;color:#666;">${data.length} records</p><div style="display:flex;flex-direction:column;gap:6px;">${formats.map(f=>`<button onclick="window._expAction('${f.id}')" style="display:flex;align-items:center;gap:10px;padding:12px 16px;border:2px solid #e0e0e0;border-radius:10px;background:white;cursor:pointer;font-size:14px;text-align:left;width:100%;font-family:inherit" onmouseover="this.style.borderColor='#1976D2';this.style.background='#E3F2FD'" onmouseout="this.style.borderColor='#e0e0e0';this.style.background='white'"><span class="material-icons">${f.icon}</span>${f.name}</button>`).join('')}</div>`, { confirmText: 'Tutup', showCancel: false });
  }

  download(content, filename, mime) { const b = new Blob([content],{type:mime}); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href=u; a.download=filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u); }
  getDateString() { const n = new Date(); return `${n.getFullYear()}${String(n.getMonth()+1).padStart(2,'0')}${String(n.getDate()).padStart(2,'0')}`; }
}

const exportManager = new ExportManager();
window.exportManager = exportManager;
console.log('✅ export.js v3.1.0 GRAND MASTER FINAL loaded');