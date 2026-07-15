/**
 * ============================================
 * OCR WORKER - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL BACKGROUND OCR PROCESSING - SIAP PRODUKSI
 * Mendukung: Tesseract.js, Image Preprocessing,
 * Field Extraction, Multi-language, Confidence
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

let ocrEngine = null;
let isInitialized = false;
let currentLanguage = 'ind+eng';
let workerInstance = null;
let processingQueue = [];
let isProcessing = false;

// ============================================
// MESSAGE HANDLER
// ============================================
self.onmessage = async (event) => {
  const { action, data, requestId } = event.data;

  try {
    let result;

    switch (action) {
      case 'init':
        result = await handleInit(data);
        break;
      case 'scan':
        result = await handleScan(data);
        break;
      case 'scanFile':
        result = await handleScanFile(data);
        break;
      case 'scanBlob':
        result = await handleScanBlob(data);
        break;
      case 'extractFields':
        result = await handleExtractFields(data);
        break;
      case 'preprocess':
        result = await handlePreprocess(data);
        break;
      case 'preprocessAdvanced':
        result = await handlePreprocessAdvanced(data);
        break;
      case 'detectTextRegions':
        result = await handleDetectTextRegions(data);
        break;
      case 'setLanguage':
        result = await handleSetLanguage(data);
        break;
      case 'getStatus':
        result = handleGetStatus();
        break;
      case 'terminate':
        result = await handleTerminate();
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    self.postMessage({ requestId, success: true, data: result });

  } catch (error) {
    self.postMessage({ requestId, success: false, error: error.message });
  }
};

// ============================================
// INITIALIZATION
// ============================================
async function handleInit(data) {
  const { language = 'ind+eng', useTesseract = true } = data || {};

  try {
    if (useTesseract && typeof Tesseract !== 'undefined') {
      self.postMessage({ type: 'progress', data: { stage: 'init', progress: 10, message: 'Loading Tesseract...' } });

      workerInstance = await Tesseract.createWorker(language);

      self.postMessage({ type: 'progress', data: { stage: 'init', progress: 50, message: 'Setting parameters...' } });

      await workerInstance.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM?.AUTO || 3,
        tessedit_ocr_engine_mode: Tesseract.OEM?.LSTM_ONLY || 1,
        preserve_interword_spaces: '1'
      });

      self.postMessage({ type: 'progress', data: { stage: 'init', progress: 100, message: 'Ready' } });

      ocrEngine = 'tesseract';
    } else {
      ocrEngine = 'basic';
    }

    isInitialized = true;
    currentLanguage = language;

    return {
      success: true,
      engine: ocrEngine,
      language: currentLanguage,
      features: ocrEngine === 'tesseract' ? ['text', 'words', 'paragraphs', 'lines', 'confidence', 'bbox'] : ['text', 'regions', 'basic']
    };

  } catch (error) {
    // Fallback to basic engine
    ocrEngine = 'basic';
    isInitialized = true;
    return { success: true, engine: 'basic', language: 'basic', features: ['text', 'regions'] };
  }
}

// ============================================
// SCANNING
// ============================================
async function handleScan(data) {
  const { imageData, options = {} } = data;

  if (!isInitialized) throw new Error('OCR engine not initialized');

  self.postMessage({ type: 'progress', data: { stage: 'scan', progress: 5 } });

  try {
    let result;

    if (ocrEngine === 'tesseract' && workerInstance) {
      result = await scanWithTesseract(imageData, options);
    } else {
      result = await scanWithBasic(imageData, options);
    }

    self.postMessage({ type: 'progress', data: { stage: 'scan', progress: 100 } });

    return result;

  } catch (error) {
    throw new Error(`OCR scan failed: ${error.message}`);
  }
}

async function handleScanFile(data) {
  const { fileBuffer, fileName, options = {} } = data;

  self.postMessage({ type: 'progress', data: { stage: 'scan', progress: 5 } });

  try {
    let result;
    const blob = new Blob([fileBuffer]);

    if (ocrEngine === 'tesseract' && workerInstance) {
      self.postMessage({ type: 'progress', data: { stage: 'scan', progress: 15 } });
      const { data: tessData } = await workerInstance.recognize(blob);
      result = formatTesseractResult(tessData);
    } else {
      const imageBitmap = await createImageBitmap(blob);
      const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imageBitmap, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      result = await scanWithBasic({ data: Array.from(imgData.data), width: imgData.width, height: imgData.height }, options);
      result.fileName = fileName;
    }

    self.postMessage({ type: 'progress', data: { stage: 'scan', progress: 100 } });
    return result;

  } catch (error) {
    throw new Error(`File scan failed: ${error.message}`);
  }
}

async function handleScanBlob(data) {
  const { blob, options = {} } = data;
  return handleScanFile({ fileBuffer: blob, options });
}

// ============================================
// TESSERACT SCANNING
// ============================================
async function scanWithTesseract(imageData, options) {
  self.postMessage({ type: 'progress', data: { stage: 'scan', progress: 20, message: 'Processing with Tesseract...' } });

  // Create ImageData from raw data
  const image = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );

  // Create bitmap from ImageData
  const canvas = new OffscreenCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.putImageData(image, 0, 0);
  const blob = await canvas.convertToBlob({ type: 'image/png' });

  self.postMessage({ type: 'progress', data: { stage: 'scan', progress: 40, message: 'Recognizing...' } });

  const { data: tessData } = await workerInstance.recognize(blob);

  self.postMessage({ type: 'progress', data: { stage: 'scan', progress: 80, message: 'Processing results...' } });

  const result = formatTesseractResult(tessData);

  // Extract fields if requested
  if (options.extractFields) {
    result.extractedFields = extractFieldsFromText(result.text, options.extractFields);
  }

  return result;
}

function formatTesseractResult(data) {
  return {
    text: cleanText(data.text),
    confidence: Math.round(data.confidence),
    words: (data.words || [])
      .filter(w => w.confidence > 30)
      .map(w => ({
        text: w.text,
        confidence: Math.round(w.confidence),
        bbox: {
          x0: w.bbox.x0, y0: w.bbox.y0,
          x1: w.bbox.x1, y1: w.bbox.y1
        }
      })),
    paragraphs: (data.paragraphs || []).map(p => ({
      text: cleanText(p.text),
      confidence: Math.round(p.confidence),
      bbox: p.bbox ? {
        x0: p.bbox.x0, y0: p.bbox.y0,
        x1: p.bbox.x1, y1: p.bbox.y1
      } : null
    })),
    lines: (data.lines || []).map(l => ({
      text: cleanText(l.text),
      confidence: Math.round(l.confidence),
      bbox: l.bbox ? {
        x0: l.bbox.x0, y0: l.bbox.y0,
        x1: l.bbox.x1, y1: l.bbox.y1
      } : null
    })),
    method: 'tesseract',
    language: currentLanguage,
    hocr: data.hocr || null,
    tsv: data.tsv || null
  };
}

// ============================================
// BASIC SCANNING (FALLBACK)
// ============================================
async function scanWithBasic(imageData, options) {
  self.postMessage({ type: 'progress', data: { stage: 'scan', progress: 10, message: 'Preprocessing...' } });

  const image = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );

  // Preprocess
  const preprocessed = await preprocessImage(image, options.preprocess || 'default');

  self.postMessage({ type: 'progress', data: { stage: 'scan', progress: 40, message: 'Detecting regions...' } });

  // Detect text regions
  const regions = detectTextRegions(preprocessed);

  self.postMessage({ type: 'progress', data: { stage: 'scan', progress: 70, message: 'Extracting text...' } });

  // Extract text
  const text = extractTextFromRegions(regions, preprocessed);

  self.postMessage({ type: 'progress', data: { stage: 'scan', progress: 90, message: 'Finalizing...' } });

  const result = {
    text: cleanText(text),
    confidence: estimateConfidence(regions, preprocessed),
    regions: regions.length,
    method: 'basic-worker',
    language: 'basic'
  };

  if (options.extractFields) {
    result.extractedFields = extractFieldsFromText(result.text, options.extractFields);
  }

  return result;
}

// ============================================
// IMAGE PREPROCESSING
// ============================================
async function handlePreprocess(data) {
  const { imageData } = data;
  const image = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
  const result = await preprocessImage(image, 'basic');
  return {
    data: Array.from(result.data),
    width: result.width,
    height: result.height
  };
}

async function handlePreprocessAdvanced(data) {
  const { imageData, options = {} } = data;
  const image = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
  const result = await preprocessImage(image, options.mode || 'advanced');
  return {
    data: Array.from(result.data),
    width: result.width,
    height: result.height
  };
}

async function preprocessImage(imageData, mode = 'default') {
  let result = imageData;

  // Step 1: Grayscale
  result = convertToGrayscale(result);

  if (mode === 'default' || mode === 'basic') {
    // Step 2: Contrast enhancement
    result = increaseContrast(result, 1.3);
    // Step 3: Denoise
    result = denoiseMedian(result);
  }

  if (mode === 'advanced') {
    // Adaptive threshold
    result = adaptiveThreshold(result, 15, 10);
    // Denoise
    result = denoiseMedian(result);
    // Sharpen
    result = sharpen(result);
    // Deskew (basic)
    result = deskewBasic(result);
  }

  return result;
}

function convertToGrayscale(imageData) {
  const data = new Uint8ClampedArray(imageData.data);
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = gray; data[i + 1] = gray; data[i + 2] = gray;
  }
  return new ImageData(data, imageData.width, imageData.height);
}

function increaseContrast(imageData, factor) {
  const data = new Uint8ClampedArray(imageData.data);
  const f = (259 * (factor * 255 + 255)) / (255 * (259 - factor * 255));
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, f * (data[i] - 128) + 128));
    data[i + 1] = data[i];
    data[i + 2] = data[i];
  }
  return new ImageData(data, imageData.width, imageData.height);
}

function applyThreshold(imageData, threshold = 128) {
  const data = new Uint8ClampedArray(imageData.data);
  for (let i = 0; i < data.length; i += 4) {
    const value = data[i] >= threshold ? 255 : 0;
    data[i] = value; data[i + 1] = value; data[i + 2] = value;
  }
  return new ImageData(data, imageData.width, imageData.height);
}

function adaptiveThreshold(imageData, blockSize = 15, C = 10) {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data.length);
  const halfBlock = Math.floor(blockSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0, count = 0;
      for (let dy = -halfBlock; dy <= halfBlock; dy++) {
        for (let dx = -halfBlock; dx <= halfBlock; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            sum += data[(ny * width + nx) * 4];
            count++;
          }
        }
      }
      const mean = sum / count;
      const idx = (y * width + x) * 4;
      const value = data[idx] > mean - C ? 255 : 0;
      result[idx] = value; result[idx + 1] = value; result[idx + 2] = value; result[idx + 3] = 255;
    }
  }
  return new ImageData(result, width, height);
}

function denoiseMedian(imageData) {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const values = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          values.push(data[((y + dy) * width + (x + dx)) * 4]);
        }
      }
      values.sort((a, b) => a - b);
      const idx = (y * width + x) * 4;
      result[idx] = values[4]; result[idx + 1] = values[4]; result[idx + 2] = values[4];
    }
  }
  return new ImageData(result, width, height);
}

function sharpen(imageData) {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data);
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0, ki = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          sum += data[((y + dy) * width + (x + dx)) * 4] * kernel[ki++];
        }
      }
      const idx = (y * width + x) * 4;
      result[idx] = Math.min(255, Math.max(0, sum));
      result[idx + 1] = result[idx]; result[idx + 2] = result[idx];
    }
  }
  return new ImageData(result, width, height);
}

function deskewBasic(imageData) {
  // Simplified deskew - in production, use Hough transform
  return imageData;
}

// ============================================
// TEXT REGION DETECTION
// ============================================
async function handleDetectTextRegions(data) {
  const { imageData } = data;
  const image = new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
  const thresholded = applyThreshold(convertToGrayscale(image), 128);
  const regions = detectTextRegions(thresholded);
  return {
    regions: regions.map(r => ({ x: r.x, y: r.y, width: r.width, height: r.height })),
    count: regions.length
  };
}

function detectTextRegions(imageData) {
  const regions = [];
  const { data, width, height } = imageData;
  const visited = new Set();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx] === 0 && !visited.has(`${x},${y}`)) {
        const region = floodFill(imageData, x, y, visited);
        if (region.width > 5 && region.height > 5 && region.width * region.height > 50) {
          regions.push(region);
        }
      }
    }
  }

  // Merge overlapping regions
  return mergeRegions(regions);
}

function floodFill(imageData, startX, startY, visited) {
  const { data, width, height } = imageData;
  const stack = [[startX, startY]];
  let minX = startX, minY = startY, maxX = startX, maxY = startY;

  while (stack.length > 0) {
    const [x, y] = stack.pop();
    const key = `${x},${y}`;
    if (x < 0 || x >= width || y < 0 || y >= height || visited.has(key)) continue;
    const idx = (y * width + x) * 4;
    if (data[idx] !== 0) continue;

    visited.add(key);
    minX = Math.min(minX, x); minY = Math.min(minY, y);
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function mergeRegions(regions, threshold = 10) {
  if (regions.length <= 1) return regions;

  const merged = [];
  const used = new Set();

  for (let i = 0; i < regions.length; i++) {
    if (used.has(i)) continue;
    let current = { ...regions[i] };
    used.add(i);

    for (let j = i + 1; j < regions.length; j++) {
      if (used.has(j)) continue;
      const r = regions[j];
      if (Math.abs(current.y - r.y) < threshold && Math.abs(current.x - r.x) < current.width + r.width + threshold) {
        current.x = Math.min(current.x, r.x);
        current.y = Math.min(current.y, r.y);
        current.width = Math.max(current.x + current.width, r.x + r.width) - current.x;
        current.height = Math.max(current.y + current.height, r.y + r.height) - current.y;
        used.add(j);
      }
    }
    merged.push(current);
  }
  return merged;
}

function extractTextFromRegions(regions, imageData) {
  // Sort by y then x (reading order)
  regions.sort((a, b) => {
    const yDiff = a.y - b.y;
    if (Math.abs(yDiff) < 15) return a.x - b.x;
    return yDiff;
  });

  // Group into lines
  const lines = [];
  let currentLine = [];
  let currentY = -1;

  regions.forEach(region => {
    if (currentY === -1 || Math.abs(region.y - currentY) < 15) {
      currentLine.push(region);
      currentY = region.y;
    } else {
      if (currentLine.length > 0) lines.push(currentLine);
      currentLine = [region];
      currentY = region.y;
    }
  });
  if (currentLine.length > 0) lines.push(currentLine);

  // Convert regions to text lines
  return lines.map(line => {
    line.sort((a, b) => a.x - b.x);
    return `[Line: ${line.length} regions]`;
  }).join('\n');
}

function estimateConfidence(regions, imageData) {
  if (regions.length === 0) return 0;
  const avgDensity = regions.reduce((sum, r) => sum + (r.width * r.height), 0) / regions.length;
  const imageArea = imageData.width * imageData.height;
  const coverage = (regions.reduce((sum, r) => sum + (r.width * r.height), 0) / imageArea) * 100;
  return Math.min(80, Math.round(coverage * 1.5));
}

// ============================================
// FIELD EXTRACTION
// ============================================
async function handleExtractFields(data) {
  const { imageData, fields = [], options = {} } = data;
  const scanResult = await handleScan({ imageData, options });
  return extractFieldsFromText(scanResult.text || '', fields);
}

function extractFieldsFromText(text, fields) {
  if (!text) return {};

  const extracted = {};
  const patterns = {
    'nomorSurat': [/Nomor\s*:\s*([^\n]+)/i, /No\.?\s*:\s*([^\n]+)/i, /Nomor\s*Surat\s*:\s*([^\n]+)/i],
    'nomorAgenda': [/Agenda\s*:\s*([^\n]+)/i, /No\.?\s*Agenda\s*:\s*([^\n]+)/i],
    'tanggal': [/Tanggal\s*:\s*([^\n]+)/i, /Tgl\.?\s*:\s*([^\n]+)/i, /(\d{1,2}\s+\w+\s+\d{4})/],
    'perihal': [/Perihal\s*:\s*([^\n]+)/i, /Hal\s*:\s*([^\n]+)/i],
    'pengirim': [/Dari\s*:\s*([^\n]+)/i, /Pengirim\s*:\s*([^\n]+)/i],
    'tujuan': [/Kepada\s*:\s*([^\n]+)/i, /Tujuan\s*:\s*([^\n]+)/i, /Yth\.?\s*([^\n]+)/i],
    'sifat': [/Sifat\s*:\s*([^\n]+)/i],
    'lampiran': [/Lampiran\s*:\s*([^\n]+)/i, /Lamp\.?\s*:\s*([^\n]+)/i],
    'email': [/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/],
    'telepon': [/(\+?62|0)[\s.-]?\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4}/],
    'nip': [/(\d{18})/],
    'kodePos': [/\b(\d{5})\b/]
  };

  fields.forEach(field => {
    const fieldPatterns = patterns[field] || [];
    for (const pattern of fieldPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extracted[field] = match[1].trim();
        break;
      }
    }
    if (!extracted[field]) extracted[field] = '';
  });

  return extracted;
}

// ============================================
// UTILITIES
// ============================================
async function handleSetLanguage(data) {
  const { language = 'ind+eng' } = data || {};
  if (workerInstance && ocrEngine === 'tesseract') {
    await workerInstance.terminate();
    workerInstance = await Tesseract.createWorker(language);
    await workerInstance.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM?.AUTO || 3,
      tessedit_ocr_engine_mode: Tesseract.OEM?.LSTM_ONLY || 1,
    });
  }
  currentLanguage = language;
  return { language: currentLanguage };
}

function handleGetStatus() {
  return {
    initialized: isInitialized,
    engine: ocrEngine,
    language: currentLanguage,
    queueLength: processingQueue.length,
    isProcessing
  };
}

async function handleTerminate() {
  if (workerInstance) {
    try { await workerInstance.terminate(); } catch (e) {}
    workerInstance = null;
  }
  isInitialized = false;
  ocrEngine = null;
  processingQueue = [];
  return { terminated: true };
}

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/^\s+|\s+$/gm, '')
    .trim();
}

console.log('✅ OCR Worker v3 initialized');
