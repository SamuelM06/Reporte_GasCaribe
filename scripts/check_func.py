import psycopg2
conn = psycopg2.connect(host='20.7.15.40', port=5432, dbname='DataCenter_Promigas', user='samuel_mena', password='XumaBD2026*')
cur = conn.cursor()
cur.execute("""
SELECT routine_definition FROM information_schema.routines 
WHERE routine_name='normalizar_producto' AND routine_schema='gestion_diaria'
""")
r = cur.fetchone()
if r:
    print(r[0])
cur.close()
conn.close()