import os
from dotenv import load_dotenv
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(dotenv_path=os.path.join(ROOT, '.env'))
import psycopg2
conn = psycopg2.connect(host=os.getenv('DB_HOST'),port=os.getenv('DB_PORT'),dbname=os.getenv('DB_NAME'),user=os.getenv('DB_USER_ETL'),password=os.getenv('DB_PASSWORD_ETL'),connect_timeout=30)
conn.autocommit = True
cur = conn.cursor()

cur.execute("""
CREATE OR REPLACE FUNCTION gestion_diaria.normalizar_producto(p TEXT) RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE v TEXT;
BEGIN
  IF p IS NULL THEN RETURN 'SIN REGISTRO'; END IF;
  v := lower(btrim(p));
  v := translate(v, 'áéíóúüñ', 'aeiouun');
  v := regexp_replace(v, '\\s+', ' ', 'g');
  IF v IN ('sin registro','no aplica','no apto','datos incompletos','pendiente vuelve a llamar','ojo se callo llamada') OR v ~ '^[0-9 ]+$' THEN RETURN 'SIN REGISTRO'; END IF;
  IF v LIKE '%practiseguro%' OR v LIKE '%practisegruo%' OR v LIKE '%practi plus%' THEN RETURN 'PRACTISEGURO'; END IF;
  IF v LIKE '%funerario%' OR v LIKE '%fuenrario%' OR v LIKE '%furnrario%' OR v LIKE '%eguro funerario%' OR v LIKE '%aeguro funerario%' THEN RETURN 'SEGURO FUNERARIO'; END IF;
  IF v LIKE '%futuro protegido plus%' OR v LIKE '%futuroprotegido%' THEN RETURN 'FUTURO PROTEGIDO PLUS'; END IF;
  IF v LIKE '%futuro protegid%' OR v LIKE '%futuroprotetor%' OR v LIKE '%futuro protector%' THEN RETURN 'FUTURO PROTEGIDO'; END IF;
  IF v LIKE '%seguro protector%' OR v LIKE '%protector brilla%' THEN RETURN 'SEGURO PROTECTOR'; END IF;
  IF v LIKE '%mascota%' THEN RETURN 'MASCOTA'; END IF;
  IF v LIKE '%proexequi%' OR v LIKE '%exequial%' OR v LIKE '%servicio exequial%' THEN RETURN 'PROEXEQUIAL'; END IF;
  IF v LIKE '%factura protegida%' OR v LIKE '%salva factura%' THEN RETURN 'FACTURA PROTEGIDA'; END IF;
  IF v LIKE '%deudor%' THEN RETURN 'DEUDOR'; END IF;
  IF v LIKE '%brilla%' THEN RETURN 'SEGURO BRILLA'; END IF;
  IF v LIKE '%paz y salvo%' THEN RETURN 'PAZ Y SALVO'; END IF;
  IF v LIKE '%cancer%' THEN RETURN 'SEGURO CANCER'; END IF;
  IF v LIKE '%vida%' OR v LIKE '%itp%' THEN RETURN 'SEGURO VIDA'; END IF;
  IF v LIKE '%microseguro%' THEN RETURN 'MICROSEGURO'; END IF;
  RETURN 'OTROS';
END $$;
""")
print('FUNC_PROD_OK')

cur.execute("""
CREATE OR REPLACE FUNCTION gestion_diaria.normalizar_aseguradora(p TEXT) RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE v TEXT;
BEGIN
  IF p IS NULL THEN RETURN 'SIN REGISTRO'; END IF;
  v := lower(btrim(p));
  v := translate(v, 'áéíóúüñ', 'aeiouun');
  v := regexp_replace(v, '\\s+', ' ', 'g');
  IF v IN ('sin registro','sin registros','no aplica','no apto') OR v LIKE '%gnp%' OR v LIKE '%ike%' OR v ~ '^[0-9 ]+$' OR v LIKE '%llamada caida%' THEN RETURN 'NO APLICA'; END IF;
  IF v LIKE '%alfa%' THEN RETURN 'ALFA'; END IF;
  IF v LIKE '%hdi%' OR v LIKE '%liberty%' THEN RETURN 'HDI'; END IF;
  IF v LIKE '%sura%' OR v LIKE '%suramericana%' THEN RETURN 'SURAMERICANA'; END IF;
  IF v LIKE '%proexequi%' THEN RETURN 'PROEXEQUIAL'; END IF;
  RETURN 'OTROS';
END $$;
""")
print('FUNC_ASEG_OK')

for t in ['caribe_inbound', 'caribe_outbound']:
    cur.execute(f"ALTER TABLE gestion_diaria.{t} ADD COLUMN IF NOT EXISTS producto_norm TEXT")
    cur.execute(f"ALTER TABLE gestion_diaria.{t} ADD COLUMN IF NOT EXISTS aseguradora_norm TEXT")
    cur.execute(f"""UPDATE gestion_diaria.{t} SET producto_norm = gestion_diaria.normalizar_producto(producto),
      aseguradora_norm = gestion_diaria.normalizar_aseguradora(aseguradora)""")
    print(f'NORM_MAT|{t}|{cur.rowcount}')

cur.execute("ALTER TABLE gestion_diaria.caribe_abandono ADD COLUMN IF NOT EXISTS gestionado_inbound BOOLEAN DEFAULT FALSE")
cur.execute("""UPDATE gestion_diaria.caribe_abandono a SET gestionado_inbound = TRUE
WHERE a.telefono IS NOT NULL AND EXISTS
 (SELECT 1 FROM gestion_diaria.caribe_inbound i WHERE i.telefono::text = a.telefono::text)""")
print(f'GESTIONADO|{cur.rowcount}')
cur.execute("SELECT COUNT(*) FROM gestion_diaria.caribe_abandono WHERE gestionado_inbound")
print('GEST_TOTAL:', cur.fetchone()[0])
cur.close(); conn.close()
