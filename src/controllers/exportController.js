import PDFDocument from 'pdfkit';
import { Parser as Json2CsvParser } from 'json2csv';
import { pool } from '../config/db.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const ALLOWED_EXPORT_FORMATS = {
  tractors: 'csv',
  recommendations: 'pdf',
};

const getCurrentDateTag = () => new Date().toISOString().slice(0, 10);

const getUserId = (req) => req.user?.user_id ?? req.user?.userId ?? null;

const PDF_THEME = {
  ink: '#111827',
  canvas: '#F7F8F4',
  forest: '#1F4D3A',
  moss: '#4D7C55',
  field: '#CFE3C6',
  soil: '#B88B5A',
  surface: '#FFFFFF',
  border: '#D9E0D7',
  muted: '#6B7280',
  success: '#2F855A',
  warning: '#D69E2E',
  danger: '#C05621',
};

const PDF_MARGIN = 50;
const PDF_FOOTER_RESERVED = 70;

const formatDateTime = (value) => new Date(value).toLocaleString('es-CO');

const formatDate = (value) => new Date(value).toLocaleDateString('es-CO');

const formatScore = (value) => (
  value !== null && value !== undefined
    ? Number.parseFloat(value).toFixed(2)
    : 'N/D'
);

const parseRecommendationObservations = (observations) => {
  if (!observations) {
    return {};
  }

  try {
    return JSON.parse(observations);
  } catch {
    return { explanation: observations };
  }
};

const getScoreBadge = (score) => {
  if (score === null || score === undefined || Number.isNaN(Number(score))) {
    return {
      label: 'Sin score',
      fill: '#E5E7EB',
      text: PDF_THEME.ink,
    };
  }

  const numericScore = Number(score);

  if (numericScore >= 80) {
    return { label: 'Alta compatibilidad', fill: '#C6F6D5', text: PDF_THEME.success };
  }

  if (numericScore >= 60) {
    return { label: 'Compatibilidad media', fill: '#FEEBC8', text: PDF_THEME.warning };
  }

  return { label: 'Revisar ajuste', fill: '#FED7D7', text: PDF_THEME.danger };
};

const drawProjectBadge = (doc, x, y, size = 64) => {
  const centerX = x + (size / 2);
  const centerY = y + (size / 2);
  const outerRadius = size * 0.48;
  const innerRadius = size * 0.38;
  const strokeWidth = Math.max(2, size * 0.055);

  doc.save();

  doc.circle(centerX, centerY, outerRadius).fill(PDF_THEME.ink);
  doc.circle(centerX, centerY, innerRadius).fill('#FFFFFF');

  doc.save();
  doc.circle(centerX, centerY, innerRadius).clip();

  const horizonY = y + (size * 0.57);
  doc
    .strokeColor(PDF_THEME.ink)
    .lineWidth(Math.max(1.2, size * 0.012))
    .moveTo(x + (size * 0.13), horizonY)
    .lineTo(x + (size * 0.87), horizonY)
    .stroke();

  const furrowStartX = x + (size * 0.50);
  const furrowBaseY = y + (size * 0.90);
  const furrowAnchors = [
    [x + (size * 0.24), y + (size * 0.72)],
    [x + (size * 0.34), y + (size * 0.68)],
    [x + (size * 0.44), y + (size * 0.65)],
    [x + (size * 0.60), y + (size * 0.64)],
    [x + (size * 0.73), y + (size * 0.67)],
  ];

  furrowAnchors.forEach(([targetX, targetY], index) => {
    const controlOffset = size * (0.06 + (index * 0.01));
    doc
      .moveTo(furrowStartX, furrowBaseY)
      .bezierCurveTo(
        furrowStartX - controlOffset,
        y + (size * 0.78),
        targetX + controlOffset,
        targetY + (size * 0.05),
        targetX,
        targetY,
      )
      .stroke();
  });

  const wheelOuter = size * 0.12;
  const wheelInner = size * 0.045;
  const rearWheelX = x + (size * 0.39);
  const frontWheelX = x + (size * 0.63);
  const wheelY = y + (size * 0.51);

  doc
    .lineWidth(Math.max(1.5, size * 0.016))
    .circle(rearWheelX, wheelY, wheelOuter)
    .stroke()
    .circle(rearWheelX, wheelY, wheelInner)
    .fillAndStroke('#FFFFFF', PDF_THEME.ink)
    .circle(frontWheelX, wheelY, size * 0.09)
    .stroke()
    .circle(frontWheelX, wheelY, size * 0.032)
    .fillAndStroke('#FFFFFF', PDF_THEME.ink);

  doc
    .lineWidth(Math.max(2, size * 0.022))
    .moveTo(x + (size * 0.25), y + (size * 0.49))
    .lineTo(x + (size * 0.30), y + (size * 0.31))
    .lineTo(x + (size * 0.55), y + (size * 0.31))
    .lineTo(x + (size * 0.58), y + (size * 0.46))
    .lineTo(x + (size * 0.25), y + (size * 0.46))
    .closePath()
    .fillAndStroke('#FFFFFF', PDF_THEME.ink);

  doc
    .moveTo(x + (size * 0.56), y + (size * 0.35))
    .lineTo(x + (size * 0.69), y + (size * 0.35))
    .lineTo(x + (size * 0.73), y + (size * 0.44))
    .lineTo(x + (size * 0.58), y + (size * 0.44))
    .closePath()
    .fillAndStroke('#FFFFFF', PDF_THEME.ink);

  doc
    .moveTo(x + (size * 0.47), y + (size * 0.30))
    .lineTo(x + (size * 0.49), y + (size * 0.20))
    .stroke()
    .moveTo(x + (size * 0.41), y + (size * 0.27))
    .lineTo(x + (size * 0.55), y + (size * 0.27))
    .stroke();

  doc
    .lineWidth(Math.max(1.1, size * 0.012))
    .moveTo(x + (size * 0.19), y + (size * 0.58))
    .lineTo(x + (size * 0.19), y + (size * 0.70))
    .lineTo(x + (size * 0.27), y + (size * 0.70))
    .stroke()
    .moveTo(x + (size * 0.23), y + (size * 0.58))
    .lineTo(x + (size * 0.30), y + (size * 0.64))
    .stroke()
    .circle(x + (size * 0.18), y + (size * 0.78), size * 0.06)
    .stroke()
    .circle(x + (size * 0.31), y + (size * 0.78), size * 0.034)
    .stroke();

  doc.restore();

  const ornamentDots = [
    [0.18, 0.25],
    [0.28, 0.18],
    [0.42, 0.14],
    [0.58, 0.16],
    [0.72, 0.22],
    [0.82, 0.31],
  ];

  ornamentDots.forEach(([offsetX, offsetY]) => {
    doc.circle(x + (size * offsetX), y + (size * offsetY), size * 0.018).fill(PDF_THEME.ink);
  });

  doc
    .lineWidth(strokeWidth)
    .circle(centerX, centerY, outerRadius)
    .stroke(PDF_THEME.ink);

  doc.restore();
};

const drawPdfFooter = (doc) => {
  const footerY = doc.page.height - 42;
  const contentWidth = doc.page.width - (PDF_MARGIN * 2);

  doc
    .strokeColor('#D1D5DB')
    .lineWidth(1)
    .moveTo(PDF_MARGIN, footerY - 10)
    .lineTo(doc.page.width - PDF_MARGIN, footerY - 10)
    .stroke();

  doc
    .fillColor(PDF_THEME.muted)
    .fontSize(8)
    .text(
      'MaqAgr | Reporte generado automaticamente para consulta interna',
      PDF_MARGIN,
      footerY,
      { width: contentWidth, align: 'center' },
    );
};

const drawCompactPageHeader = (doc) => {
  const width = doc.page.width - (PDF_MARGIN * 2);

  doc
    .roundedRect(PDF_MARGIN, 30, width, 48, 16)
    .fill('#F0F5F1');

  drawProjectBadge(doc, PDF_MARGIN + 14, 38, 30);

  doc
    .fillColor(PDF_THEME.ink)
    .fontSize(13)
    .text('Reporte de Recomendaciones', PDF_MARGIN + 56, 44)
    .fillColor(PDF_THEME.muted)
    .fontSize(9)
    .text('MaqAgr', PDF_MARGIN + 56, 61);

  drawPdfFooter(doc);
  doc.y = 98;
};

const ensurePdfSpace = (doc, requiredHeight) => {
  if ((doc.y + requiredHeight) <= (doc.page.height - PDF_FOOTER_RESERVED)) {
    return;
  }

  doc.addPage();
  drawCompactPageHeader(doc);
};

const drawMetricPill = (doc, x, y, width, label, value) => {
  doc
    .roundedRect(x, y, width, 58, 16)
    .fillAndStroke('#FFFFFF', PDF_THEME.border);

  doc
    .fillColor(PDF_THEME.muted)
    .fontSize(8)
    .text(label.toUpperCase(), x + 14, y + 12, { width: width - 28 })
    .fillColor(PDF_THEME.ink)
    .fontSize(11)
    .text(value, x + 14, y + 28, { width: width - 28 });
};

const measureInfoColumn = (doc, items, width) => items.reduce((total, item) => {
  const labelHeight = 12;
  const valueHeight = doc
    .fontSize(10.5)
    .heightOfString(item.value, { width });
  return total + labelHeight + valueHeight + 12;
}, 0);

const drawInfoColumn = (doc, items, x, startY, width) => {
  let cursorY = startY;

  items.forEach((item) => {
    doc
      .fillColor(PDF_THEME.muted)
      .fontSize(8)
      .text(item.label.toUpperCase(), x, cursorY, { width });

    cursorY = doc.y + 2;

    doc
      .fillColor(PDF_THEME.ink)
      .fontSize(10.5)
      .text(item.value, x, cursorY, { width });

    cursorY = doc.y + 10;
  });

  return cursorY;
};

const drawHeroHeader = (doc, user, totalRecommendations) => {
  const contentWidth = doc.page.width - (PDF_MARGIN * 2);
  const heroHeight = 146;
  const heroY = 36;

  doc.rect(0, 0, doc.page.width, doc.page.height).fill(PDF_THEME.canvas);

  doc
    .roundedRect(PDF_MARGIN, heroY, contentWidth, heroHeight, 24)
    .fill(PDF_THEME.forest);

  doc
    .roundedRect(PDF_MARGIN, heroY + 84, contentWidth, 62, 24)
    .fill('#234E3C');

  drawProjectBadge(doc, PDF_MARGIN + 20, heroY + 18, 72);

  doc
    .fillColor('#F9FAFB')
    .fontSize(22)
    .text('Reporte de Recomendaciones', PDF_MARGIN + 108, heroY + 28)
    .fontSize(10.5)
    .fillColor('#D1FAE5')
    .text(
      'Resumen exportable de recomendaciones persistidas para el usuario autenticado.',
      PDF_MARGIN + 108,
      heroY + 62,
      { width: 300 },
    );

  const pillWidth = (contentWidth - 28) / 3;
  const pillsY = heroY + 98;

  drawMetricPill(doc, PDF_MARGIN + 14, pillsY, pillWidth, 'Fecha', formatDateTime(new Date()));
  drawMetricPill(
    doc,
    PDF_MARGIN + 14 + pillWidth + 14,
    pillsY,
    pillWidth,
    'Usuario',
    `${user?.name || 'Sin nombre'}\n${user?.email || 'N/D'}`,
  );
  drawMetricPill(
    doc,
    PDF_MARGIN + 14 + ((pillWidth + 14) * 2),
    pillsY,
    pillWidth,
    'Total',
    `${totalRecommendations} recomendación(es)`,
  );

  drawPdfFooter(doc);
  doc.y = heroY + heroHeight + 22;
};

const drawEmptyState = (doc) => {
  ensurePdfSpace(doc, 180);

  const x = PDF_MARGIN;
  const y = doc.y;
  const width = doc.page.width - (PDF_MARGIN * 2);

  doc
    .roundedRect(x, y, width, 150, 22)
    .fillAndStroke('#FFFFFF', PDF_THEME.border);

  drawProjectBadge(doc, x + ((width - 74) / 2), y + 18, 74);

  doc
    .fillColor(PDF_THEME.ink)
    .fontSize(16)
    .text('Sin recomendaciones registradas', x, y + 100, {
      width,
      align: 'center',
    })
    .fillColor(PDF_THEME.muted)
    .fontSize(10.5)
    .text(
      'Genera una recomendación desde el modulo de calculo para incluirla en este reporte PDF.',
      x + 46,
      y + 124,
      { width: width - 92, align: 'center' },
    );
};

const drawRecommendationCard = (doc, row, index) => {
  const cardX = PDF_MARGIN;
  const cardWidth = doc.page.width - (PDF_MARGIN * 2);
  const columnGap = 18;
  const columnWidth = (cardWidth - 58 - columnGap) / 2;

  const observationData = parseRecommendationObservations(row.observations);
  const scoreBadge = getScoreBadge(row.compatibility_score);
  const explanation = observationData.explanation || 'Sin observaciones adicionales registradas.';
  const classification = observationData.classification?.label
    ? `${observationData.classification.label} - ${observationData.classification.description || 'Clasificacion registrada'}`
    : 'Clasificacion no disponible';

  const dateText = row.recommendation_date
    ? formatDate(row.recommendation_date)
    : 'Sin fecha';
  const tractorText = row.tractor_name
    ? `${row.tractor_brand} ${row.tractor_model} (${row.engine_power_hp} HP)`
    : 'No asignado';
  const implementText = row.implement_name
    ? `${row.implement_brand} ${row.implement_name}`
    : 'No asignado';
  const terrainText = row.terrain_name
    ? `${row.terrain_name} | ${row.soil_type || 'Suelo N/D'}`
    : 'No asignado';

  const leftItems = [
    { label: 'Fecha', value: dateText },
    { label: 'Terreno', value: terrainText },
    { label: 'Implemento', value: implementText },
  ];

  const rightItems = [
    { label: 'Tractor', value: tractorText },
    { label: 'Trabajo', value: row.work_type || 'general' },
    { label: 'Compatibilidad', value: `${formatScore(row.compatibility_score)} pts` },
  ];

  const leftColumnHeight = measureInfoColumn(doc, leftItems, columnWidth);
  const rightColumnHeight = measureInfoColumn(doc, rightItems, columnWidth);
  const infoHeight = Math.max(leftColumnHeight, rightColumnHeight);
  const explanationWidth = cardWidth - 40;
  const classificationHeight = doc
    .fontSize(10.5)
    .heightOfString(classification, { width: explanationWidth });
  const explanationHeight = doc
    .fontSize(10.5)
    .heightOfString(explanation, { width: explanationWidth });
  const cardHeight = 126 + infoHeight + classificationHeight + explanationHeight;

  ensurePdfSpace(doc, cardHeight + 16);

  const cardY = doc.y;
  const detailsY = cardY + 44;

  doc
    .roundedRect(cardX, cardY, cardWidth, cardHeight, 18)
    .fillAndStroke('#FFFFFF', PDF_THEME.border);

  doc
    .roundedRect(cardX, cardY, cardWidth, 10, 18)
    .fill('#E7F0E8');

  doc
    .fillColor(PDF_THEME.ink)
    .fontSize(13)
    .text(`Recomendacion ${index + 1}`, cardX + 20, cardY + 18)
    .fillColor(PDF_THEME.muted)
    .fontSize(9)
    .text(`Registro #${row.recommendation_id}`, cardX + 20, cardY + 35);

  doc
    .roundedRect(cardX + cardWidth - 138, cardY + 18, 118, 24, 12)
    .fill(scoreBadge.fill);

  doc
    .fillColor(scoreBadge.text)
    .fontSize(8.5)
    .text(scoreBadge.label, cardX + cardWidth - 132, cardY + 26, {
      width: 106,
      align: 'center',
    });

  const leftEndY = drawInfoColumn(doc, leftItems, cardX + 20, detailsY, columnWidth);
  const rightEndY = drawInfoColumn(
    doc,
    rightItems,
    cardX + 38 + columnWidth,
    detailsY,
    columnWidth,
  );

  const dividerY = Math.max(leftEndY, rightEndY) + 2;

  doc
    .strokeColor('#E5E7EB')
    .lineWidth(1)
    .moveTo(cardX + 20, dividerY)
    .lineTo(cardX + cardWidth - 20, dividerY)
    .stroke();

  doc
    .fillColor(PDF_THEME.muted)
    .fontSize(8)
    .text('CLASIFICACION', cardX + 20, dividerY + 12)
    .fillColor(PDF_THEME.ink)
    .fontSize(10.5)
    .text(classification, cardX + 20, dividerY + 26, {
      width: explanationWidth,
    })
    .fillColor(PDF_THEME.muted)
    .fontSize(8)
    .text('OBSERVACION', cardX + 20, doc.y + 8)
    .fillColor(PDF_THEME.ink)
    .fontSize(10.5)
    .text(explanation, cardX + 20, doc.y + 12, {
      width: explanationWidth,
    });

  doc.y = cardY + cardHeight + 16;
};

const ensureFormat = (res, requestedFormat, expectedFormat) => {
  if (requestedFormat !== expectedFormat) {
    res.status(400).json({
      success: false,
      message: `Formato inválido. Use format=${expectedFormat}`,
    });
    return false;
  }
  return true;
};

export const exportTractorsCatalog = asyncHandler(async (req, res) => {
  const format = String(req.query.format || '').toLowerCase();
  if (!ensureFormat(res, format, ALLOWED_EXPORT_FORMATS.tractors)) {
    return;
  }

  const tractorsResult = await pool.query(`
    SELECT
      t.name,
      t.brand,
      t.engine_power_hp AS power,
      COALESCE(t.model_year, EXTRACT(YEAR FROM t.registration_date)::int) AS year,
      t.price
    FROM tractor t
    ORDER BY t.brand ASC, t.model ASC
  `);

  const parser = new Json2CsvParser({
    fields: ['name', 'brand', 'power', 'year', 'price'],
  });
  const csv = parser.parse(tractorsResult.rows);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="tractors-catalog-${getCurrentDateTag()}.csv"`,
  );

  return res.status(200).send(csv);
});

export const exportUserRecommendationsPdf = asyncHandler(async (req, res) => {
  const format = String(req.query.format || '').toLowerCase();
  if (!ensureFormat(res, format, ALLOWED_EXPORT_FORMATS.recommendations)) {
    return;
  }

  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado',
    });
  }

  const userResult = await pool.query(
    'SELECT user_id, name, email FROM users WHERE user_id = $1',
    [userId],
  );
  const user = userResult.rows[0];

  const recommendationsResult = await pool.query(
    `
      SELECT
        r.recommendation_id,
        r.recommendation_date,
        r.work_type,
        r.compatibility_score,
        r.observations,
        t.name AS terrain_name,
        t.soil_type,
        tr.name AS tractor_name,
        tr.brand AS tractor_brand,
        tr.model AS tractor_model,
        tr.engine_power_hp,
        i.implement_name,
        i.brand AS implement_brand
      FROM recommendation r
      LEFT JOIN terrain t ON t.terrain_id = r.terrain_id
      LEFT JOIN tractor tr ON tr.tractor_id = r.tractor_id
      LEFT JOIN implement i ON i.implement_id = r.implement_id
      WHERE r.user_id = $1
      ORDER BY r.recommendation_date DESC
    `,
    [userId],
  );

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="recommendations-${userId}-${getCurrentDateTag()}.pdf"`,
  );

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);

  drawHeroHeader(doc, user, recommendationsResult.rows.length);

  if (recommendationsResult.rows.length === 0) {
    drawEmptyState(doc);
    doc.end();
    return;
  }

  doc
    .fillColor(PDF_THEME.ink)
    .fontSize(14)
    .text('Recomendaciones registradas', PDF_MARGIN, doc.y)
    .fillColor(PDF_THEME.muted)
    .fontSize(9.5)
    .text(
      'Cada tarjeta resume el tractor sugerido, el terreno analizado y la observacion persistida al momento de generar la recomendacion.',
      PDF_MARGIN,
      doc.y + 6,
      { width: doc.page.width - (PDF_MARGIN * 2) },
    );

  doc.y += 22;

  recommendationsResult.rows.forEach((row, index) => {
    drawRecommendationCard(doc, row, index);
  });

  doc.end();
});

export default {
  exportTractorsCatalog,
  exportUserRecommendationsPdf,
};
