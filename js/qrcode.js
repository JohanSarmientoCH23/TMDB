/**
 * QR Code Generator - Pure JavaScript implementation
 * Generates QR codes on HTML5 Canvas without external dependencies
 */
const QRCode = (() => {

  // Error correction levels
  const EC_LOW = 0;
  const EC_MEDIUM = 1;
  const EC_QUARTILE = 2;
  const EC_HIGH = 3;

  // Mode indicators
  const MODE_NUMERIC = 1;
  const MODE_ALPHANUMERIC = 2;
  const MODE_BYTE = 4;

  // Version capacities (EC level M, byte mode)
  const CAPACITIES = [
    0,14,26,42,62,84,106,122,152,180,213,251,287,331,362,412,450,504,560,624,666,
    711,779,857,911,997,1059,1125,1190,1264,1370,1452,1538,1628,1722,1809,1911,1989,
    2099,2213,2331,2451,2587,2679,2801,2957,3083,3211,3365,3535,3709,3893,4093,4205,
    4367,4559,4683,4847,5065,5235,5431,5627,5839,5999,6211,6427,6643,6875,7075,7303,
    7527,7783,8007,8263,8495,8751,8991,9267,9511,9785,10031,10285,10537,10813,11065,
    11341,11623,11879,12163,12451,12719,13009,13305,13615,13931,14251,14535,14851,
    15179,15491,15823,16167,16511,16871,17201,17555,17923,18243,18615,18987,19335,
    19707,20063,20443,20787,21163,21543,21915,22287,22683,23051,23443,23835,24199,
    24611,25003,25419,25835,26251,26683,27099,27539,27983
  ];

  // Alignment pattern positions per version
  const ALIGNMENT_POSITIONS = [
    [],
    [],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],
    [6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],
    [6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],
    [6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],
    [6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],
    [6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],
    [6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],
    [6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]
  ];

  // Format information bits (EC level M)
  const FORMAT_INFO = [
    0x5412,0x5125,0x5E7C,0x5B4B,0x45F9,0x40CE,0x4F97,0x4AA0,
    0x77C4,0x72F3,0x7DAA,0x789D,0x662F,0x6318,0x6C41,0x6976,
    0x1689,0x13BE,0x1CE7,0x19D0,0x0762,0x0255,0x0D0C,0x083B,
    0x355F,0x3068,0x3F31,0x3A06,0x24B4,0x2183,0x2EDA,0x2BED
  ];

  // Galois field math
  const GF = (() => {
    const EXP = new Array(256);
    const LOG = new Array(256);
    let x = 1;
    for (let i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
    }
    EXP[255] = EXP[0];
    return {
      exp: (a) => EXP[((a % 255) + 255) % 255],
      log: (a) => LOG[a],
      mul: (a, b) => {
        if (a === 0 || b === 0) return 0;
        return EXP[(LOG[a] + LOG[b]) % 255];
      }
    };
  })();

  function getVersion(dataLength, ecLevel) {
    for (let v = 1; v <= 40; v++) {
      const cap = getCapacity(v, ecLevel);
      if (dataLength <= cap) return v;
    }
    return -1;
  }

  function getCapacity(version, ecLevel) {
    const totalCodewords = getTotalCodewords(version);
    const ecCodewords = getEcCodewords(version, ecLevel);
    const groups = getGroups(version, ecLevel);
    let dataCodewords = 0;
    for (const g of groups) {
      dataCodewords += g.count * (g.dataCodewordsPerBlock - ecCodewords);
    }
    return dataCodewords;
  }

  function getTotalCodewords(version) {
    const size = version * 4 + 17;
    let total = size * size;
    total -= 31; // timing patterns
    total -= (version >= 2 ? (getAlignmentPositions(version).length - 2) * 25 - (getAlignmentPositions(version).length - 2) * 2 : 0);
    total -= 3 * (size - 8) - 5; // separators + format area adjustments  
    total -= 215; // approximate finder+separator+format
    if (version >= 2) total -= getAlignmentPositions(version).length > 0 ? 25 : 0;
    total -= 31; // timing
    total -= version >= 7 ? 36 : 0; // version info
    return Math.floor(total / 8);
  }

  function getEcCodewords(version, ecLevel) {
    const ecTable = [
      [7,10,13,17],[10,16,22,28],[15,26,18,22],[20,18,26,16],
      [26,24,18,22],[18,16,24,28],[20,18,26,28],[24,22,26,22],
      [30,22,24,24],[18,26,28,30],[20,30,28,24],[24,22,28,28],
      [26,22,26,30],[30,24,28,24],[22,24,30,30],[24,28,28,30],
      [28,28,26,30],[30,26,28,30],[28,26,30,30],[28,26,30,30]
    ];
    const idx = Math.floor(ecLevel * 5 + version / 40 * 5) % 20;
    return ecTable[idx % 20][idx % 4];
  }

  function getGroups(version, ecLevel) {
    const totalCodewords = getTotalCodewords(version);
    const ecPerBlock = getEcCodewords(version, ecLevel);
    const numBlocks = ecLevel === 0 ? Math.max(1, Math.floor(version / 7)) :
                      ecLevel === 1 ? Math.max(1, Math.floor(version / 6)) :
                      ecLevel === 2 ? Math.max(1, Math.floor(version / 5)) :
                      Math.max(1, Math.floor(version / 4));
    const dataPerBlock = Math.floor(totalCodewords / numBlocks);
    const remainder = totalCodewords % numBlocks;
    const groups = [];
    for (let i = 0; i < numBlocks; i++) {
      const dc = dataPerBlock + (i >= numBlocks - remainder ? 1 : 0);
      groups.push({ count: 1, dataCodewordsPerBlock: dc });
    }
    // Merge consecutive groups with same size
    const merged = [];
    for (const g of groups) {
      if (merged.length > 0 && merged[merged.length-1].dataCodewordsPerBlock === g.dataCodewordsPerBlock) {
        merged[merged.length-1].count++;
      } else {
        merged.push({ ...g });
      }
    }
    return merged;
  }

  function getAlignmentPositions(version) {
    if (version === 1) return [];
    return ALIGNMENT_POSITIONS[version - 2] || [];
  }

  // Data encoding
  function encodeData(text, version, ecLevel) {
    const mode = detectMode(text);
    const size = version * 4 + 17;
    const bits = [];

    // Mode indicator (4 bits)
    pushBits(bits, mode, 4);

    // Character count
    const ccBits = version <= 9 ? (mode === 1 ? 10 : mode === 2 ? 9 : 8) :
                   version <= 26 ? (mode === 1 ? 12 : mode === 2 ? 11 : 16) :
                   (mode === 1 ? 14 : mode === 2 ? 13 : 16);
    pushBits(bits, text.length, ccBits);

    // Data
    if (mode === MODE_NUMERIC) {
      for (let i = 0; i < text.length; i += 3) {
        const chunk = text.substring(i, i + 3);
        const num = parseInt(chunk, 10);
        if (chunk.length === 3) pushBits(bits, num, 10);
        else if (chunk.length === 2) pushBits(bits, num, 7);
        else pushBits(bits, num, 4);
      }
    } else if (mode === MODE_ALPHANUMERIC) {
      const alphaMap = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
      for (let i = 0; i < text.length; i += 2) {
        const a = alphaMap.indexOf(text[i]);
        const b = i + 1 < text.length ? alphaMap.indexOf(text[i + 1]) : -1;
        if (b >= 0) pushBits(bits, a * 45 + b, 11);
        else pushBits(bits, a, 6);
      }
    } else {
      for (let i = 0; i < text.length; i++) {
        pushBits(bits, text.charCodeAt(i) & 0xFF, 8);
      }
    }

    // Terminator
    const capacity = getCapacity(version, ecLevel) * 8;
    const termLen = Math.min(4, capacity - bits.length);
    pushBits(bits, 0, termLen);

    // Pad to byte boundary
    while (bits.length % 8 !== 0) bits.push(0);

    // Pad bytes
    const padBytes = [0xEC, 0x11];
    let padIdx = 0;
    while (bits.length < capacity) {
      pushBits(bits, padBytes[padIdx], 8);
      padIdx = (padIdx + 1) % 2;
    }

    return bits;
  }

  function detectMode(text) {
    if (/^\d+$/.test(text)) return MODE_NUMERIC;
    if (/^[0-9A-Z $%*+\-./:]+$/.test(text)) return MODE_ALPHANUMERIC;
    return MODE_BYTE;
  }

  function pushBits(arr, value, length) {
    for (let i = length - 1; i >= 0; i--) {
      arr.push((value >> i) & 1);
    }
  }

  // Reed-Solomon error correction
  function rsEncode(data, ecCount) {
    // Build generator polynomial
    let gen = [1];
    for (let i = 0; i < ecCount; i++) {
      const newGen = new Array(gen.length + 1).fill(0);
      for (let j = 0; j < gen.length; j++) {
        newGen[j] ^= gen[j];
        newGen[j + 1] ^= GF.mul(gen[j], GF.exp(i));
      }
      gen = newGen;
    }

    const result = new Array(ecCount).fill(0);
    for (let i = 0; i < data.length; i++) {
      const coef = data[i] ^ result[0];
      result.shift();
      result.push(0);
      if (coef !== 0) {
        for (let j = 0; j < result.length; j++) {
          result[j] ^= GF.mul(gen[j + 1], coef);
        }
      }
    }
    return result;
  }

  // Matrix construction
  function createMatrix(version) {
    const size = version * 4 + 17;
    const matrix = Array.from({ length: size }, () => new Array(size).fill(0));
    const reserved = Array.from({ length: size }, () => new Array(size).fill(false));
    return { matrix, reserved, size };
  }

  function placeFinderPattern(m, row, col) {
    const pattern = [
      [1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1],
      [1,0,1,1,1,0,1],
      [1,0,1,1,1,0,1],
      [1,0,1,1,1,0,1],
      [1,0,0,0,0,0,1],
      [1,1,1,1,1,1,1]
    ];
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const mr = row + r, mc = col + c;
        if (mr >= 0 && mr < m.size && mc >= 0 && mc < m.size) {
          if (r >= 0 && r < 7 && c >= 0 && c < 7) {
            m.matrix[mr][mc] = pattern[r][c];
          }
          m.reserved[mr][mc] = true;
        }
      }
    }
  }

  function placeAlignmentPattern(m, row, col) {
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const mr = row + r, mc = col + c;
        if (mr >= 0 && mr < m.size && mc >= 0 && mc < m.size && !m.reserved[mr][mc]) {
          const dist = Math.max(Math.abs(r), Math.abs(c));
          m.matrix[mr][mc] = dist === 0 || dist === 2 ? 1 : 0;
          m.reserved[mr][mc] = true;
        }
      }
    }
  }

  function placeTimingPatterns(m) {
    for (let i = 8; i < m.size - 8; i++) {
      if (!m.reserved[6][i]) {
        m.matrix[6][i] = i % 2 === 0 ? 1 : 0;
        m.reserved[6][i] = true;
      }
      if (!m.reserved[i][6]) {
        m.matrix[i][6] = i % 2 === 0 ? 1 : 0;
        m.reserved[i][6] = true;
      }
    }
  }

  function reserveFormatArea(m) {
    // Around top-left finder
    for (let i = 0; i <= 8; i++) {
      m.reserved[8][i] = true;
      m.reserved[i][8] = true;
    }
    // Around top-right finder
    for (let i = m.size - 8; i < m.size; i++) {
      m.reserved[8][i] = true;
    }
    // Around bottom-left finder
    for (let i = m.size - 7; i < m.size; i++) {
      m.reserved[i][8] = true;
    }
    // Dark module
    m.matrix[m.size - 8][8] = 1;
    m.reserved[m.size - 8][8] = true;
  }

  function placeData(m, bits) {
    let bitIdx = 0;
    let upward = true;
    for (let col = m.size - 1; col >= 0; col -= 2) {
      if (col === 6) col = 5; // Skip timing column
      const rows = upward ?
        Array.from({ length: m.size }, (_, i) => m.size - 1 - i) :
        Array.from({ length: m.size }, (_, i) => i);

      for (const row of rows) {
        for (let dc = 0; dc <= 1; dc++) {
          const c = col - dc;
          if (c >= 0 && c < m.size && !m.reserved[row][c]) {
            m.matrix[row][c] = bitIdx < bits.length ? bits[bitIdx] : 0;
            bitIdx++;
          }
        }
      }
      upward = !upward;
    }
  }

  function applyMask(m, maskNum) {
    const maskFns = [
      (r, c) => (r + c) % 2 === 0,
      (r, c) => r % 2 === 0,
      (r, c) => c % 3 === 0,
      (r, c) => (r + c) % 3 === 0,
      (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
      (r, c) => ((r * c) % 2 + (r * c) % 3) === 0,
      (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
      (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0,
    ];

    const masked = m.matrix.map(row => [...row]);
    for (let r = 0; r < m.size; r++) {
      for (let c = 0; c < m.size; c++) {
        if (!m.reserved[r][c] && maskFns[maskNum](r, c)) {
          masked[r][c] ^= 1;
        }
      }
    }
    return masked;
  }

  function placeFormatInfo(matrix, maskNum) {
    const ecLevel = 1; // M
    const formatIdx = ecLevel * 8 + maskNum;
    const bits = FORMAT_INFO[formatIdx] || 0;

    // Around top-left
    const positions1 = [
      [8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],
      [7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]
    ];
    // Bottom-left and top-right
    const sz = matrix.length;
    const positions2 = [
      [sz-1,8],[sz-2,8],[sz-3,8],[sz-4,8],[sz-5,8],[sz-6,8],[sz-7,8],
      [8,sz-8],[8,sz-7],[8,sz-6],[8,sz-5],[8,sz-4],[8,sz-3],[8,sz-2],[8,sz-1]
    ];

    for (let i = 0; i < 15; i++) {
      const bit = (bits >> (14 - i)) & 1;
      if (i < positions1.length) {
        matrix[positions1[i][0]][positions1[i][1]] = bit;
      }
      if (i < positions2.length) {
        const [r, c] = positions2[i];
        if (r >= 0 && r < matrix.length && c >= 0 && c < matrix[0].length) {
          matrix[r][c] = bit;
        }
      }
    }
  }

  function calculatePenalty(matrix) {
    let penalty = 0;
    const size = matrix.length;

    // Rule 1: runs of same color
    for (let r = 0; r < size; r++) {
      let count = 1;
      for (let c = 1; c < size; c++) {
        if (matrix[r][c] === matrix[r][c-1]) {
          count++;
          if (count === 5) penalty += 3;
          else if (count > 5) penalty += 1;
        } else {
          count = 1;
        }
      }
    }
    for (let c = 0; c < size; c++) {
      let count = 1;
      for (let r = 1; r < size; r++) {
        if (matrix[r][c] === matrix[r-1][c]) {
          count++;
          if (count === 5) penalty += 3;
          else if (count > 5) penalty += 1;
        } else {
          count = 1;
        }
      }
    }

    // Rule 2: 2x2 blocks
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size - 1; c++) {
        const v = matrix[r][c];
        if (v === matrix[r][c+1] && v === matrix[r+1][c] && v === matrix[r+1][c+1]) {
          penalty += 3;
        }
      }
    }

    return penalty;
  }

  function generate(text, ecLevel = 1) {
    const version = getVersion(text.length, ecLevel);
    if (version < 0) throw new Error('Text too long for QR code');

    const bits = encodeData(text, version, ecLevel);
    const groups = getGroups(version, ecLevel);
    const ecPerBlock = getEcCodewords(version, ecLevel);

    // Split into blocks
    const blocks = [];
    let offset = 0;
    for (const g of groups) {
      for (let i = 0; i < g.count; i++) {
        const blockData = [];
        for (let j = 0; j < g.dataCodewordsPerBlock; j++) {
          const byteIdx = Math.floor((offset + j) / 8);
          const bitIdx = (offset + j) % 8;
          const val = byteIdx < bits.length / 8 ? 
            bits.slice(byteIdx * 8, byteIdx * 8 + 8).reduce((acc, b, i) => acc | (b << (7-i)), 0) : 0;
          blockData.push(val);
        }
        blocks.push(blockData);
        offset += g.dataCodewordsPerBlock * 8;
      }
    }

    // Generate EC for each block
    const ecBlocks = blocks.map(block => rsEncode(block, ecPerBlock));

    // Interleave data blocks
    const interleaved = [];
    const maxDataLen = Math.max(...blocks.map(b => b.length));
    for (let i = 0; i < maxDataLen; i++) {
      for (const block of blocks) {
        if (i < block.length) interleaved.push(block[i]);
      }
    }

    // Interleave EC blocks
    for (let i = 0; i < ecPerBlock; i++) {
      for (const ec of ecBlocks) {
        if (i < ec.length) interleaved.push(ec[i]);
      }
    }

    // Convert to bit array
    const dataBits = [];
    for (const byte of interleaved) {
      for (let i = 7; i >= 0; i--) {
        dataBits.push((byte >> i) & 1);
      }
    }

    // Create matrix
    const m = createMatrix(version);
    placeFinderPattern(m, 0, 0);
    placeFinderPattern(m, 0, m.size - 7);
    placeFinderPattern(m, m.size - 7, 0);
    placeTimingPatterns(m);
    reserveFormatArea(m);

    // Alignment patterns
    const alignPos = getAlignmentPositions(version);
    if (alignPos.length > 0) {
      for (const r of alignPos) {
        for (const c of alignPos) {
          if (!m.reserved[r][c]) {
            placeAlignmentPattern(m, r, c);
          }
        }
      }
    }

    // Place data
    placeData(m, dataBits);

    // Try all masks and pick best
    let bestMask = 0;
    let bestPenalty = Infinity;
    for (let mask = 0; mask < 8; mask++) {
      const masked = applyMask(m, mask);
      placeFormatInfo(masked, mask);
      const penalty = calculatePenalty(masked);
      if (penalty < bestPenalty) {
        bestPenalty = penalty;
        bestMask = mask;
      }
    }

    const finalMatrix = applyMask(m, bestMask);
    placeFormatInfo(finalMatrix, bestMask);

    return { matrix: finalMatrix, size: m.size, version };
  }

  function toCanvas(canvas, text, options = {}) {
    const {
      cellSize = 4,
      margin = 4,
      darkColor = '#000000',
      lightColor = '#FFFFFF'
    } = options;

    const qr = generate(text);
    const totalSize = qr.size * cellSize + margin * 2;

    canvas.width = totalSize;
    canvas.height = totalSize;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = lightColor;
    ctx.fillRect(0, 0, totalSize, totalSize);

    ctx.fillStyle = darkColor;
    for (let r = 0; r < qr.size; r++) {
      for (let c = 0; c < qr.size; c++) {
        if (qr.matrix[r][c] === 1) {
          ctx.fillRect(
            margin + c * cellSize,
            margin + r * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }

    return canvas;
  }

  return { generate, toCanvas };

})();
