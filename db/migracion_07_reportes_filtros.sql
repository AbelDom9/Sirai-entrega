DROP VIEW reportes_asistencia;
CREATE VIEW reportes_asistencia AS
SELECT
  CONCAT(e.id, '-', r.periodo)                             AS id,
  e.id                                                     AS estancia_id,
  e.nombre                                                 AS estancia_nombre,
  e.estado                                                 AS estado,
  e.ur                                                     AS ur,
  r.periodo                                                AS periodo,
  CAST(CONCAT(r.periodo, '-01') AS DATE)                   AS fecha_inicio,
  COUNT(*)                                                 AS total_registros,
  SUM(r.codigo IN ('presente', 'filtro_salud'))            AS presentes,
  SUM(r.codigo IN ('falta_justificada', 'falta_injustificada', 'licencia_medica'))
                                                           AS ausentes,
  ROUND(100 * SUM(r.codigo IN ('presente', 'filtro_salud')) / COUNT(*), 1)
                                                           AS porcentaje_asistencia
FROM (
  SELECT a.estancia_id, DATE_FORMAT(a.fecha, '%Y-%m') AS periodo, c.codigo
  FROM asistencias a
  JOIN cat_estado_asistencia c ON a.estado_id = c.id
) AS r
JOIN estancias e ON r.estancia_id = e.id
GROUP BY e.id, e.nombre, r.periodo, e.estado, e.ur;