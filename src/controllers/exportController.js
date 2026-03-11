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

  // Logo simple vectorial para no depender de archivos estáticos.
  doc.rect(50, 40, 130, 35).fill('#2F855A');
  doc.fillColor('#FFFFFF').fontSize(15).text('MAQAGR', 78, 51);

  doc
    .fillColor('#1A202C')
    .fontSize(18)
    .text('Reporte de Recomendaciones', 50, 95)
    .moveDown(0.5)
    .fontSize(11)
    .text(`Fecha de exportación: ${new Date().toLocaleString('es-CO')}`)
    .text(`Usuario: ${user?.name || 'Sin nombre'} (${user?.email || 'N/D'})`)
    .text(`Total de recomendaciones: ${recommendationsResult.rows.length}`)
    .moveDown();

  if (recommendationsResult.rows.length === 0) {
    doc.fontSize(12).text('No hay recomendaciones para este usuario.');
    doc.end();
    return;
  }

  recommendationsResult.rows.forEach((row, index) => {
    if (doc.y > 720) {
      doc.addPage();
    }

    const dateText = row.recommendation_date
      ? new Date(row.recommendation_date).toLocaleDateString('es-CO')
      : 'Sin fecha';
    const tractorText = row.tractor_name
      ? `${row.tractor_brand} ${row.tractor_model} (${row.engine_power_hp} HP)`
      : 'No asignado';
    const implementText = row.implement_name
      ? `${row.implement_brand} ${row.implement_name}`
      : 'No asignado';
    const compatibility = row.compatibility_score !== null
      ? Number.parseFloat(row.compatibility_score).toFixed(2)
      : 'N/D';

    doc
      .fontSize(12)
      .fillColor('#2D3748')
      .text(`${index + 1}. Recomendación #${row.recommendation_id}`, { underline: true })
      .moveDown(0.25)
      .fontSize(10)
      .fillColor('#4A5568')
      .text(`Fecha: ${dateText}`)
      .text(`Tipo de trabajo: ${row.work_type || 'general'}`)
      .text(`Terreno: ${row.terrain_name || 'N/D'} (${row.soil_type || 'N/D'})`)
      .text(`Tractor recomendado: ${tractorText}`)
      .text(`Implemento recomendado: ${implementText}`)
      .text(`Compatibilidad: ${compatibility}`)
      .moveDown(0.9);
  });

  doc.end();
});

export default {
  exportTractorsCatalog,
  exportUserRecommendationsPdf,
};
