import psycopg2

conn = psycopg2.connect(
    host='20.7.15.40', port=5432,
    dbname='DataCenter_Promigas',
    user='samuel_mena', password='XumaBD2026*'
)
cur = conn.cursor()

# 1. Verificar clasificación
print("=== CLASIFICACIONES ===")
cur.execute("""
SELECT gasera, variante, resultado_normalizado, clasificacion
FROM gestion_diaria.clasificacion
WHERE gasera='GasCaribe'
ORDER BY clasificacion, variante;
""")
for row in cur.fetchall():
    print(row)

# 2. Ver valores sin mapear
print("\n=== VALORES SIN MAPEAR ===")
cur.execute("SELECT * FROM gestion_diaria.v_valores_sin_mapear")
for row in cur.fetchall():
    print(row)

# 3. Resumen inbound por mes y clasificación
print("\n=== RESUMEN INBOUND ===")
cur.execute("""
SELECT mes, clasificacion, COUNT(*)
FROM gestion_diaria.v_caribe_inbound_clasificado
GROUP BY 1,2 ORDER BY 1,2
""")
for row in cur.fetchall():
    print(row)

# 4. Resumen outbound por mes y clasificación
print("\n=== RESUMEN OUTBOUND ===")
cur.execute("""
SELECT mes, clasificacion, COUNT(*)
FROM gestion_diaria.v_caribe_outbound_clasificado
GROUP BY 1,2 ORDER BY 1,2
""")
for row in cur.fetchall():
    print(row)

# 5. Verificar conteos por cabina inbound
print("\n=== INBOUND POR CABINA ===")
cur.execute("""
SELECT hoja_origen, COUNT(*) FROM gestion_diaria.caribe_inbound GROUP BY 1 ORDER BY 1
""")
for row in cur.fetchall():
    print(row)

# 6. Verificar conteos por cabina outbound
print("\n=== OUTBOUND POR CABINA ===")
cur.execute("""
SELECT COUNT(*) FROM gestion_diaria.caribe_outbound
""")
for row in cur.fetchall():
    print(f"Total outbound: {row[0]}")

# 7. Fórmula retención: APTAs / (APTAs + NO APTAs) * 100 = Retenciones / Aptas * 100
print("\n=== VERIFICACION FORMULA RETENCION (Inbound) ===")
cur.execute("""
SELECT mes,
       SUM(CASE WHEN clasificacion='APTA' THEN 1 ELSE 0 END) AS aptas,
       SUM(CASE WHEN clasificacion='NO APTA' THEN 1 ELSE 0 END) AS no_aptas,
       SUM(CASE WHEN clasificacion='APTA' AND resultado_normalizado='retenido' THEN 1 ELSE 0 END) AS retenidas,
       ROUND(
         CASE WHEN SUM(CASE WHEN clasificacion='APTA' THEN 1 ELSE 0 END) > 0
         THEN SUM(CASE WHEN clasificacion='APTA' AND resultado_normalizado='retenido' THEN 1 ELSE 0 END)::numeric
              / SUM(CASE WHEN clasificacion='APTA' THEN 1 ELSE 0 END) * 100
         ELSE 0 END, 2) AS pct_retencion
FROM gestion_diaria.v_caribe_inbound_clasificado
GROUP BY mes ORDER BY mes
""")
for row in cur.fetchall():
    print(f"Mes: {row[0]}, Aptas: {row[1]}, No Aptas: {row[2]}, Retenidas: {row[3]}, %Ret: {row[4]}%")

print("\n=== VERIFICACION FORMULA RETENCION (Outbound) ===")
cur.execute("""
SELECT mes,
       SUM(CASE WHEN clasificacion='APTA' THEN 1 ELSE 0 END) AS aptas,
       SUM(CASE WHEN clasificacion='NO APTA' THEN 1 ELSE 0 END) AS no_aptas,
       SUM(CASE WHEN clasificacion='APTA' AND resultado_normalizado='retenido' THEN 1 ELSE 0 END) AS retenidas,
       ROUND(
         CASE WHEN SUM(CASE WHEN clasificacion='APTA' THEN 1 ELSE 0 END) > 0
         THEN SUM(CASE WHEN clasificacion='APTA' AND resultado_normalizado='retenido' THEN 1 ELSE 0 END)::numeric
              / SUM(CASE WHEN clasificacion='APTA' THEN 1 ELSE 0 END) * 100
         ELSE 0 END, 2) AS pct_retencion
FROM gestion_diaria.v_caribe_outbound_clasificado
GROUP BY mes ORDER BY mes
""")
for row in cur.fetchall():
    print(f"Mes: {row[0]}, Aptas: {row[1]}, No Aptas: {row[2]}, Retenidas: {row[3]}, %Ret: {row[4]}%")

cur.close()
conn.close()