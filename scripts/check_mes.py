import psycopg2
conn = psycopg2.connect(host='20.7.15.40', port=5432, dbname='DataCenter_Promigas', user='samuel_mena', password='XumaBD2026*')
cur = conn.cursor()
cur.execute("SELECT DISTINCT mes FROM gestion_diaria.caribe_inbound ORDER BY 1")
for r in cur.fetchall():
    print(repr(r[0]))
cur.close()
conn.close()