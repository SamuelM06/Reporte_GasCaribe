import psycopg2
conn = psycopg2.connect(host='20.7.15.40', port=5432, dbname='DataCenter_Promigas', user='samuel_mena', password='XumaBD2026*')
cur = conn.cursor()

# Test the filter pattern 'ENERO %'
cur.execute("SELECT COUNT(*) FROM gestion_diaria.caribe_inbound WHERE mes ILIKE 'ENERO %'")
print("Filter 'ENERO %':", cur.fetchone())

cur.execute("SELECT COUNT(*) FROM gestion_diaria.caribe_outbound WHERE mes ILIKE 'ENERO %'")
print("Filter outbound 'ENERO %':", cur.fetchone())

cur.close()
conn.close()