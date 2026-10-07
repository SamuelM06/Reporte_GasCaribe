import psycopg2
conn = psycopg2.connect(host='20.7.15.40', port=5432, dbname='DataCenter_Promigas', user='samuel_mena', password='XumaBD2026*')
cur = conn.cursor()

# Test exact match
cur.execute("SELECT COUNT(*) FROM gestion_diaria.caribe_inbound WHERE mes = 'ENERO 2026'")
print("Exact match:", cur.fetchone())

# Test ILIKE with %
cur.execute("SELECT COUNT(*) FROM gestion_diaria.caribe_inbound WHERE mes ILIKE 'ENERO 2026%'")
print("ILIKE no space:", cur.fetchone())

cur.execute("SELECT COUNT(*) FROM gestion_diaria.caribe_inbound WHERE mes ILIKE 'ENERO 2026 %'")
print("ILIKE with space:", cur.fetchone())

cur.close()
conn.close()