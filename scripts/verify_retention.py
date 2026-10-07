import psycopg2
import pandas as pd
conn = psycopg2.connect(host='20.7.15.40', port=5432, dbname='DataCenter_Promigas', user='samuel_mena', password='XumaBD2026*')
cur = conn.cursor()

print("=== VERIFICACIÓN COMPLETA FÓRMULA RETENCIÓN ===")
print("Fórmula: % Retención = Retenidas / Aptas * 100")
print("Aptas = Cancelado + Cancelado+Reintegro + Cancelado+Venta + Cancelado+Primas + Retenido")
print("Retenidas = solo 'Retenido'")
print()

# INBOUND
print("--- INBOUND ---")
cur.execute("""
SELECT mes,
       SUM(CASE WHEN clasificacion='APTA' THEN 1 ELSE 0 END) AS aptas,
       SUM(CASE WHEN clasificacion='APTA' AND resultado_normalizado='cancelado' THEN 1 ELSE 0 END) AS cancelado,
       SUM(CASE WHEN clasificacion='APTA' AND resultado_normalizado='cancelado + reintegro' THEN 1 ELSE 0 END) AS cancelado_reintegro,
       SUM(CASE WHEN clasificacion='APTA' AND resultado_normalizado='cancelado + venta' THEN 1 ELSE 0 END) AS cancelado_venta,
       SUM(CASE WHEN clasificacion='APTA' AND resultado_normalizado='retenido' THEN 1 ELSE 0 END) AS retenido,
       SUM(CASE WHEN clasificacion='NO APTA' THEN 1 ELSE 0 END) AS no_aptas,
       ROUND(
         CASE WHEN SUM(CASE WHEN clasificacion='APTA' THEN 1 ELSE 0 END) > 0
         THEN SUM(CASE WHEN clasificacion='APTA' AND resultado_normalizado='retenido' THEN 1 ELSE 0 END)::numeric
              / SUM(CASE WHEN clasificacion='APTA' THEN 1 ELSE 0 END) * 100
         ELSE 0 END, 2) AS pct_retencion
FROM gestion_diaria.v_caribe_inbound_clasificado
GROUP BY mes ORDER BY mes
""")
print(f"{'Mes':<15} {'Aptas':>6} {'Cancelado':>10} {'+Reint':>8} {'+Venta':>8} {'Retenido':>8} {'NoAptas':>8} {'%Ret':>6}")
for r in cur.fetchall():
    print(f"{r[0]:<15} {r[1]:>6} {r[2]:>10} {r[3]:>8} {r[4]:>8} {r[5]:>8} {r[6]:>8} {r[7]:>6.2f}%")

# OUTBOUND
print()
print("--- OUTBOUND ---")
cur.execute("""
SELECT mes,
       SUM(CASE WHEN clasificacion='APTA' THEN 1 ELSE 0 END) AS aptas,
       SUM(CASE WHEN clasificacion='APTA' AND resultado_normalizado='cancelado' THEN 1 ELSE 0 END) AS cancelado,
       SUM(CASE WHEN clasificacion='APTA' AND resultado_normalizado='cancelado + reintegro' THEN 1 ELSE 0 END) AS cancelado_reintegro,
       SUM(CASE WHEN clasificacion='APTA' AND resultado_normalizado='cancelado + venta' THEN 1 ELSE 0 END) AS cancelado_venta,
       SUM(CASE WHEN clasificacion='APTA' AND resultado_normalizado='retenido' THEN 1 ELSE 0 END) AS retenido,
       SUM(CASE WHEN clasificacion='NO APTA' THEN 1 ELSE 0 END) AS no_aptas,
       ROUND(
         CASE WHEN SUM(CASE WHEN clasificacion='APTA' THEN 1 ELSE 0 END) > 0
         THEN SUM(CASE WHEN clasificacion='APTA' AND resultado_normalizado='retenido' THEN 1 ELSE 0 END)::numeric
              / SUM(CASE WHEN clasificacion='APTA' THEN 1 ELSE 0 END) * 100
         ELSE 0 END, 2) AS pct_retencion
FROM gestion_diaria.v_caribe_outbound_clasificado
GROUP BY mes ORDER BY mes
""")
print(f"{'Mes':<15} {'Aptas':>6} {'Cancelado':>10} {'+Reint':>8} {'+Venta':>8} {'Retenido':>8} {'NoAptas':>8} {'%Ret':>6}")
for r in cur.fetchall():
    print(f"{r[0]:<15} {r[1]:>6} {r[2]:>10} {r[3]:>8} {r[4]:>8} {r[5]:>8} {r[6]:>8} {r[7]:>6.2f}%")

# TOTALES
print()
print("--- TOTALES INBOUND ---")
cur.execute("""
SELECT 
    SUM(CASE WHEN clasificacion='APTA' THEN 1 ELSE 0 END) AS aptas,
    SUM(CASE WHEN clasificacion='APTA' AND resultado_normalizado='cancelado' THEN 1 ELSE 0 END) AS cancelado,
    SUM(CASE WHEN clasificacion='APTA' AND resultado_normalizado='cancelado + reintegro' THEN 1 ELSE 0 END) AS cancelado_reintegro,
    SUM(CASE WHEN clasificacion='APTA' AND resultado_normalizado='cancelado + venta' THEN 1 ELSE 0 END) AS cancelado_venta,
    SUM(CASE WHEN clasificacion='APTA' AND resultado_normalizado='retenido' THEN 1 ELSE 0 END) AS retenido,
    SUM(CASE WHEN clasificacion='NO APTA' THEN 1 ELSE 0 END) AS no_aptas
FROM gestion_diaria.v_caribe_inbound_clasificado
""")
r = cur.fetchone()
print(f"Aptas: {r[0]} (Cancelado: {r[1]}, +Reintegro: {r[2]}, +Venta: {r[3]}, Retenido: {r[4]})")
print(f"No Aptas: {r[5]}")
print(f"% Retención: {r[4]/r[0]*100:.2f}%" if r[0] > 0 else "N/A")

print()
print("--- TOTALES OUTBOUND ---")
cur.execute("""
SELECT 
    SUM(CASE WHEN clasificacion='APTA' THEN 1 ELSE 0 END) AS aptas,
    SUM(CASE WHEN clasificacion='APTA' AND resultado_normalizado='cancelado' THEN 1 ELSE 0 END) AS cancelado,
    SUM(CASE WHEN clasificacion='APTA' AND resultado_normalizado='cancelado + reintegro' THEN 1 ELSE 0 END) AS cancelado_reintegro,
    SUM(CASE WHEN clasificacion='APTA' AND resultado_normalizado='cancelado + venta' THEN 1 ELSE 0 END) AS cancelado_venta,
    SUM(CASE WHEN clasificacion='APTA' AND resultado_normalizado='retenido' THEN 1 ELSE 0 END) AS retenido,
    SUM(CASE WHEN clasificacion='NO APTA' THEN 1 ELSE 0 END) AS no_aptas
FROM gestion_diaria.v_caribe_outbound_clasificado
""")
r = cur.fetchone()
print(f"Aptas: {r[0]} (Cancelado: {r[1]}, +Reintegro: {r[2]}, +Venta: {r[3]}, Retenido: {r[4]})")
print(f"No Aptas: {r[5]}")
print(f"% Retención: {r[4]/r[0]*100:.2f}%" if r[0] > 0 else "N/A")

# Verificar conteos Excel vs DB
print()
print("=== VERIFICACIÓN EXCEL vs DB (INBOUND) ===")
meses = ['ENERO 2026','FEBRERO 2026','MARZO 2026','ABRIL 2026','MAYO 2026','JUNIO 2026','JULIO 2026','AGOSTO 2026','SEPTIEMBRE 2026']
xls = pd.ExcelFile('data/raw/GasCaribe/Inbound_Caribe.xlsx')
for mes in meses:
    sheet_name = mes if mes in xls.sheet_names else ('SEPTIEMBRE 2026 ' if mes == 'SEPTIEMBRE 2026' else mes)
    if sheet_name in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name=sheet_name)
        cur.execute("SELECT COUNT(*) FROM gestion_diaria.caribe_inbound WHERE mes=%s", (mes,))
        db_count = cur.fetchone()[0]
        match = "OK" if len(df) == db_count else "FAIL"
        print(f"  {mes}: Excel={len(df)}, DB={db_count} {match}")
    else:
        print(f"  {mes}: HOJA NO ENCONTRADA EN EXCEL")

# Outbound: filtrar Excel por fecha y comparar
print()
print("=== VERIFICACIÓN EXCEL vs DB (OUTBOUND) ===")
import pandas as pd
df = pd.read_excel('data/raw/GasCaribe/Outbound_Caribe.xlsx', sheet_name='Outbound')
df.columns = [c.strip() for c in df.columns.astype(str)]
fecha_col = None
for c in ['fecha de base', 'FECHA DE LLAMADA', 'FECHA REGISTRO']:
    if c in df.columns:
        fecha_col = c
        break
df['fecha_de_ejecucion'] = pd.to_datetime(df[fecha_col], dayfirst=True, errors='coerce') if fecha_col else pd.NaT
df_filtrado = df[(df['fecha_de_ejecucion'] >= '2026-01-01') & (df['fecha_de_ejecucion'] <= '2026-09-30')]
print(f"Excel total: {len(df)}, Excel ene-sep: {len(df_filtrado)}")
cur.execute("SELECT COUNT(*) FROM gestion_diaria.caribe_outbound")
db_total = cur.fetchone()[0]
print(f"DB total: {db_total} {'OK' if len(df_filtrado) == db_total else 'FAIL'}")

# Por mes outbound
for mes in meses:
    cur.execute("SELECT COUNT(*) FROM gestion_diaria.caribe_outbound WHERE mes=%s", (mes,))
    db_count = cur.fetchone()[0]
    if mes in ['ENERO 2026','FEBRERO 2026','MARZO 2026','ABRIL 2026','MAYO 2026','JUNIO 2026','JULIO 2026','AGOSTO 2026','SEPTIEMBRE 2026']:
        excel_mes = df_filtrado[df_filtrado['fecha_de_ejecucion'].dt.strftime('%B %Y').str.upper() == mes.replace(' 2026','').strip()]
        # Better: use month/year
        mes_num = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE'].index(mes.replace(' 2026','')) + 1
        excel_count = len(df_filtrado[(df_filtrado['fecha_de_ejecucion'].dt.month == mes_num) & (df_filtrado['fecha_de_ejecucion'].dt.year == 2026)])
        match = "OK" if excel_count == db_count else "FAIL"
        print(f"  {mes}: Excel={excel_count}, DB={db_count} {match}")

cur.close()
conn.close()