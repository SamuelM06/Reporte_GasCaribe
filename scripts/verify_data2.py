import psycopg2
conn = psycopg2.connect(host='20.7.15.40', port=5432, dbname='DataCenter_Promigas', user='samuel_mena', password='XumaBD2026*')
cur = conn.cursor()

# Ver si existe 'cancelado + primas' en los datos
print('=== BUSCAR CANCELADO + PRIMAS EN INBOUND ===')
cur.execute("""
SELECT DISTINCT resultado_normalizado, COUNT(*) 
FROM gestion_diaria.v_caribe_inbound_clasificado 
WHERE lower(resultado_normalizado) LIKE '%prima%'
GROUP BY 1
""")
for r in cur.fetchall():
    print(r)

print()
print('=== BUSCAR CANCELADO + PRIMAS EN OUTBOUND ===')
cur.execute("""
SELECT DISTINCT resultado_normalizado, COUNT(*) 
FROM gestion_diaria.v_caribe_outbound_clasificado 
WHERE lower(resultado_normalizado) LIKE '%prima%'
GROUP BY 1
""")
for r in cur.fetchall():
    print(r)

# Ver todos los resultados normalizados únicos en inbound
print()
print('=== TODOS RESULTADOS NORMALIZADOS INBOUND ===')
cur.execute("""
SELECT resultado_normalizado, clasificacion, COUNT(*) 
FROM gestion_diaria.v_caribe_inbound_clasificado 
GROUP BY 1,2 ORDER BY 2, 1
""")
for r in cur.fetchall():
    print(r)

print()
print('=== TODOS RESULTADOS NORMALIZADOS OUTBOUND ===')
cur.execute("""
SELECT resultado_normalizado, clasificacion, COUNT(*) 
FROM gestion_diaria.v_caribe_outbound_clasificado 
GROUP BY 1,2 ORDER BY 2, 1
""")
for r in cur.fetchall():
    print(r)

cur.close()
conn.close()