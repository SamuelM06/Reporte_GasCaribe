import psycopg2
conn = psycopg2.connect(host='20.7.15.40', port=5432, dbname='DataCenter_Promigas', user='samuel_mena', password='XumaBD2026*')
cur = conn.cursor()
cur.execute("SELECT COUNT(*) FROM gestion_diaria.caribe_inbound WHERE anio = 2026")
print("Inbound 2026:", cur.fetchone())
cur.execute("SELECT COUNT(*) FROM gestion_diaria.caribe_outbound WHERE anio = 2026")
print("Outbound 2026:", cur.fetchone())
cur.close()
conn.close()