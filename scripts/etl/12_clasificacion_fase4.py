import os
from dotenv import load_dotenv
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(dotenv_path=os.path.join(ROOT, '.env'))
import psycopg2
conn = psycopg2.connect(host=os.getenv('DB_HOST'),port=os.getenv('DB_PORT'),dbname=os.getenv('DB_NAME'),user=os.getenv('DB_USER_ETL'),password=os.getenv('DB_PASSWORD_ETL'),connect_timeout=20)
conn.autocommit = True
cur = conn.cursor()

cur.execute("""
CREATE OR REPLACE FUNCTION gestion_diaria.normalizar_texto(p TEXT) RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE v TEXT;
BEGIN
  IF p IS NULL THEN RETURN NULL; END IF;
  v := lower(p);
  v := translate(v, 'áéíóúüñ', 'aeiouun');
  v := regexp_replace(v, '\\s*\\+\\s*', ' + ', 'g');
  v := regexp_replace(v, '\\s+', ' ', 'g');
  RETURN btrim(v);
END $$;
""")
print('FUNC_OK')

cur.execute("""
CREATE TABLE IF NOT EXISTS gestion_diaria.clasificacion (
  gasera TEXT NOT NULL,
  variante TEXT NOT NULL,
  resultado_normalizado TEXT NOT NULL,
  clasificacion TEXT NOT NULL CHECK (clasificacion IN ('APTA','NO APTA')),
  PRIMARY KEY (gasera, variante)
);
""")
print('TABLE_OK')

seed = [
 # --- APTA: 4 canonicos ---
 ('cancelado','cancelado','APTA'),('retenido','retenido','APTA'),
 ('cancelado + reintegro','cancelado + reintegro','APTA'),('cancelado + venta','cancelado + venta','APTA'),
 # --- APTA: alias de escritura ---
 ('cancelada','cancelado','APTA'),('cancelada + venta','cancelado + venta','APTA'),
 ('cancelada +venta','cancelado + venta','APTA'),('cancelada+venta','cancelado + venta','APTA'),
 ('cancelado+venta','cancelado + venta','APTA'),('cancelado +venta','cancelado + venta','APTA'),
 ('cancelado+reintegro','cancelado + reintegro','APTA'),('cancelado +reintegro','cancelado + reintegro','APTA'),
 ('cancelado /reintegro','cancelado + reintegro','APTA'),('cancelacion+reintegro','cancelado + reintegro','APTA'),
 ('cancelacion + reintegro','cancelado + reintegro','APTA'),
 ('retenida','retenido','APTA'),('retnido','retenido','APTA'),
 # --- NO APTA conocidos ---
 ('cancelacion previa','cancelacion previa','NO APTA'),('cancelado previa','cancelado previa','NO APTA'),
 ('informacion','informacion','NO APTA'),('informativo','informativo','NO APTA'),
 ('informacion errada','informacion errada','NO APTA'),
 ('no apto','no apto','NO APTA'),('no aplica','no aplica','NO APTA'),('tercero','tercero','NO APTA'),
 ('no contacto','no contacto','NO APTA'),('no contesta','no contesta','NO APTA'),
 ('no hubo contacto','no hubo contacto','NO APTA'),
 ('no es proceso de retencion','no es proceso de retencion','NO APTA'),
 ('telefono apagado','telefono apagado','NO APTA'),
 ('cancelado por job','cancelado por job','NO APTA'),
 ('cancelado + reembolso','cancelado + reembolso','NO APTA'),
 ('no tiene recursos','no tiene recursos','NO APTA'),('no tiene resursus','no tiene resursus','NO APTA'),
 ('ya fue cancelado','ya fue cancelado','NO APTA'),('numero equivocado','numero equivocado','NO APTA'),
 ('no tiene activos seguros','no tiene activos seguros','NO APTA'),
]
for var, res, cla in seed:
    cur.execute("INSERT INTO gestion_diaria.clasificacion (gasera,variante,resultado_normalizado,clasificacion) VALUES ('GasCaribe',%s,%s,%s) ON CONFLICT (gasera,variante) DO NOTHING", (var,res,cla))
print(f'SEED|{len(seed)}')

for t in ['inbound','outbound']:
    cur.execute(f"""CREATE OR REPLACE VIEW gestion_diaria.v_caribe_{t}_clasificado AS
SELECT x.*, COALESCE(c.resultado_normalizado, gestion_diaria.normalizar_texto(x.estado)) AS resultado_normalizado,
  COALESCE(c.clasificacion,'NO APTA') AS clasificacion
FROM gestion_diaria.caribe_{t} x
LEFT JOIN gestion_diaria.clasificacion c ON c.gasera='GasCaribe' AND c.variante=gestion_diaria.normalizar_texto(x.estado);""")
    print(f'VIEW_{t}_OK')

cur.execute("""CREATE OR REPLACE VIEW gestion_diaria.v_valores_sin_mapear AS
SELECT DISTINCT gestion_diaria.normalizar_texto(estado) AS valor, 'inbound' AS origen FROM gestion_diaria.caribe_inbound
WHERE estado IS NOT NULL AND gestion_diaria.normalizar_texto(estado) NOT IN (SELECT variante FROM gestion_diaria.clasificacion WHERE gasera='GasCaribe')
UNION
SELECT DISTINCT gestion_diaria.normalizar_texto(estado), 'outbound' FROM gestion_diaria.caribe_outbound
WHERE estado IS NOT NULL AND gestion_diaria.normalizar_texto(estado) NOT IN (SELECT variante FROM gestion_diaria.clasificacion WHERE gasera='GasCaribe');""")
print('VIEW_SINMAPEAR_OK')
cur.execute("SELECT * FROM gestion_diaria.v_valores_sin_mapear")
pend = cur.fetchall()
print(f'SIN_MAPEAR|{pend}')
for t in ['inbound','outbound']:
    cur.execute(f"SELECT mes, clasificacion, COUNT(*) FROM gestion_diaria.v_caribe_{t}_clasificado GROUP BY 1,2 ORDER BY 1,2")
    print(f'RESUMEN_{t.upper()}:')
    for r in cur.fetchall(): print(f'  {r[0]}|{r[1]}|{r[2]}')
cur.close(); conn.close()
