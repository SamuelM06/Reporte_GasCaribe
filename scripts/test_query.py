import psycopg2
conn = psycopg2.connect(host='20.7.15.40', port=5432, dbname='DataCenter_Promigas', user='samuel_mena', password='XumaBD2026*')
cur = conn.cursor()
cur.execute("""
SELECT prod AS producto,
       COALESCE(SUM(CASE WHEN src='in' THEN 1 ELSE 0 END),0)::int AS inbound,
       COALESCE(SUM(CASE WHEN src='out' THEN 1 ELSE 0 END),0)::int AS outbound
FROM (
  SELECT gestion_diaria.normalizar_producto(producto) AS prod, 'in' AS src FROM gestion_diaria.caribe_inbound WHERE mes ILIKE 'ENERO 2026 %'
  UNION ALL
  SELECT gestion_diaria.normalizar_producto(producto) AS prod, 'out' AS src FROM gestion_diaria.caribe_outbound WHERE mes ILIKE 'ENERO 2026 %'
) u
WHERE prod NOT IN ('SIN REGISTRO','OTROS')
GROUP BY 1
ORDER BY (COALESCE(SUM(CASE WHEN src='in' THEN 1 ELSE 0 END),0) + COALESCE(SUM(CASE WHEN src='out' THEN 1 ELSE 0 END),0)) DESC
LIMIT 10
""")
for r in cur.fetchall():
    print(r)
cur.close()
conn.close()