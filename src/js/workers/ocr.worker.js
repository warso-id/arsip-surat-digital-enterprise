/**
 * OCR WORKER - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Background OCR processing
 */

let ocrEngine = null;
let isInitialized = false;

// Handle messages from main thread
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
      case 'extractFields':
        result = await handleExtractFields(data);
        break;
      case 'preprocess':
        result = await handlePreprocess(data);
        break;
      case 'getStatus':
        result = { initialized: isInitialized, engine: ocrEngine ? 'ready' : 'not loaded' };
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    self.postMessage({ requestId, success: true, data: result });
    
  } catch (error) {
    self.postMessage({ requestId, success: false, error: error.message });
  }
};

/**
 * Initialize OCR engine
 */
async function handleInit(data) {
  const { language = 'eng' } = data || {};
  
  try {
    // In production, load Tesseract.js worker
    // For now, mark as initialized for basic processing
    isInitialized = true;
    
    self.postMessage({ 
      type: 'progress', 
      data: { stage: 'init', progress: 100 } 
    });
    
    return { success: true, language };
  } catch (error) {
    throw new Error(`OCR init failed: ${error.message}`);
  }
}

/**
 * Scan image for text
 */
async function handleScan(data) {
  const { imageData, options = {} } = data;
  
  if (!isInitialized) {
    throw new Error('OCR engine not initialized');
  }
  
  self.postMessage({ type: 'progress', data: { stage: 'scan', progress: 10 } });
  
  try {
    // Create ImageData from raw data
    const image = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );
    
    self.postMessage({ type: 'progress', data: { stage: 'scan', progress: 30 } });
    
    // Convert to grayscale
    const grayscale = convertToGrayscale(image);
    
    self.postMessage({ type: 'progress', data: { stage: 'scan', progress: 50 } });
    
    // Apply threshold
    const threshold = applyThreshold(grayscale, options.threshold || 128);
    
    self.postMessage({ type: 'progress', data: { stage: 'scan', progress: 70 } });
    
    // Detect text regions
    const regions = detectTextRegions(threshold);
    
    self.postMessage({ type: 'progress', data: { stage: 'scan', progress: 90 } });
    
    // Extract text (basic implementation)
    const text = extractText(regions, threshold);
    
    self.postMessage({ type: 'progress', data: { stage: 'scan', progress: 100 } });
    
    return {
      text,
      confidence: 0.6,
      regions: regions.length,
      method: 'basic-worker'
    };
    
  } catch (error) {
    throw new Error(`OCR scan failed: ${error.message}`);
  }
}

/**
 * Extract specific fields
 */
async function handleExtractFields(data) {
  const { imageData, fields = [] } = data;
  
  // First scan the image
  const scanResult = await handleScan({ imageData });
  const text = scanResult.text || '';
  
  const extracted = {};
  
  fields.forEach(field => {
    switch (field) {
      case 'nomorSurat':
        extracted.nomorSurat = extractPattern(text, /Nomor\s*:\s*([^\n]+)/i);
        break;
      case 'tanggal':
        extracted.tanggal = extractPattern(text, /Tanggal\s*:\s*([^\n]+)/i);
        break;
      case 'perihal':
        extracted.perihal = extractPattern(text, /Perihal\s*:\s*([^\n]+)/i);
        break;
      case 'pengirim':
        extracted.pengirim = extractPattern(text, /Dari\s*:\s*([^\n]+)/i);
        break;
      case 'tujuan':
        extracted.tujuan = extractPattern(text, /Kepada\s*:\s*([^\n]+)/i);
        break;
      default:
        extracted[field] = extractPattern(text, new RegExp(`${field}\\s*:\\s*([^\\n]+)`, 'i'));
    }
  });
  
  return extracted;
}

/**
 * Preprocess image for better OCR
 */
async function handlePreprocess(data) {
  const { imageData } = data;
  
  const image = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );
  
  // Convert to grayscale
  const grayscale = convertToGrayscale(image);
  
  // Increase contrast
  const contrasted = increaseContrast(grayscale, 1.5);
  
  // Denoise
  const denoised = denoise(contrasted);
  
  // Sharpen
  const sharpened = sharpen(denoised);
  
  return {
    data: Array.from(sharpened.data),
    width: sharpened.width,
    height: sharpened.height
  };
}

/**
 * Convert image to grayscale
 */
function convertToGrayscale(imageData) {
  const data = new Uint8ClampedArray(imageData.data);
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
  
  return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Apply threshold
 */
function applyThreshold(imageData, threshold) {
  const data = new Uint8ClampedArray(imageData.data);
  
  for (let i = 0; i < data.length; i += 4) {
    const value = data[i] >= threshold ? 255 : 0;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }
  
  return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Detect text regions
 */
function detectTextRegions(imageData) {
  const regions = [];
  const { data, width, height } = imageData;
  const visited = new Set();
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const key = `${x},${y}`;
      
      if (data[idx] === 0 && !visited.has(key)) {
        // Found dark pixel, flood fill to find region
        const region = floodFill(imageData, x, y, visited);
        if (region.width > 5 && region.height > 5) {
          regions.push(region);
        }
      }
    }
  }
  
  return regions;
}

/**
 * Flood fill to find connected region
 */
function floodFill(imageData, startX, startY, visited) {
  const { data, width, height } = imageData;
  const stack = [[startX, startY]];
  let minX = startX, minY = startY, maxX = startX, maxY = startY;
  
  while (stack.length > 0) {
    const [x, y] = stack.pop();
    const key = `${x},${y}`;
    
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (visited.has(key)) continue;
    
    const idx = (y * width + x) * 4;
    if (data[idx] !== 0) continue;
    
    visited.add(key);
    
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
}

/**
 * Extract text from regions (basic)
 */
function extractText(regions, imageData) {
  // Sort regions by y then x (reading order)
  regions.sort((a, b) => {
    const yDiff = a.y - b.y;
    if (Math.abs(yDiff) < 10) return a.x - b.x;
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
  
  // Convert regions to text (placeholder)
  return lines.map(() => '[Text Region]').join('\n');
}

/**
 * Increase contrast
 */
function increaseContrast(imageData, factor) {
  const data = new Uint8ClampedArray(imageData.data);
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
    data[i + 1] = data[i];
    data[i + 2] = data[i];
  }
  
  return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Denoise image (median filter)
 */
function denoise(imageData) {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const values = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          values.push(data[idx]);
        }
      }
      values.sort((a, b) => a - b);
      const idx = (y * width + x) * 4;
      result[idx] = values[4];
      result[idx + 1] = values[4];
      result[idx + 2] = values[4];
    }
  }
  
  return new ImageData(result, width, height);
}

/**
 * Sharpen image
 */
function sharpen(imageData) {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data);
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      let ki = 0;
      for (let dy =
