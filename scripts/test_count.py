import psycopg2
conn = psycopg2.connect(host='20.7.15.40', port=5432, dbname='DataCenter_Promigas', user='samuel_mena', password='XumaBD2026*')
cur = conn.cursor()
cur.execute("SELECT COUNT(*) FROM gestion_diaria.caribe_inbound WHERE mes ILIKE 'ENERO 2026 %'")
print("Inbound:", cur.fetchone())
cur.execute("SELECT COUNT(*) FROM gestion_diaria.caribe_outbound WHERE mes ILIKE 'ENERO 2026 %'")
print("Outbound:", cur.fetchone())
cur.close()
conn.close()