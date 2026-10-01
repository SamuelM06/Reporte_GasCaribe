import os
from dotenv import load_dotenv
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(dotenv_path=os.path.join(ROOT, '.env'))
import psycopg2
conn = psycopg2.connect(host=os.getenv('DB_HOST'),port=os.getenv('DB_PORT'),dbname=os.getenv('DB_NAME'),user=os.getenv('DB_USER_ETL'),password=os.getenv('DB_PASSWORD_ETL'),connect_timeout=30)
conn.autocommit = False
cur = conn.cursor()
try:
    for t in ['caribe_inbound','caribe_outbound']:
        cur.execute(f"UPDATE gestion_diaria.{t} SET estado='SIN REGISTRO' WHERE estado IS NULL")
        print(f'ESTADO_SINREGISTRO|{t}|{cur.rowcount}')
    cur.execute("INSERT INTO gestion_diaria.clasificacion (gasera,variante,resultado_normalizado,clasificacion) VALUES ('GasCaribe','sin registro','sin registro','NO APTA') ON CONFLICT (gasera,variante) DO NOTHING")
    print('CATALOGO_SINREGISTRO_OK')
    for t in ['caribe_inbound','caribe_outbound']:
        cur.execute(f"""UPDATE gestion_diaria.{t} x
SET resultado_normalizado = COALESCE(
      (SELECT c.resultado_normalizado FROM gestion_diaria.clasificacion c
       WHERE c.gasera='GasCaribe' AND c.variante = gestion_diaria.normalizar_texto(x.estado)),
      gestion_diaria.normalizar_texto(x.estado)),
    clasificacion = COALESCE(
      (SELECT c.clasificacion FROM gestion_diaria.clasificacion c
       WHERE c.gasera='GasCaribe' AND c.variante = gestion_diaria.normalizar_texto(x.estado)),
      'NO APTA')""")
        print(f'REMATERIALIZADO|{t}|{cur.rowcount}')
    conn.commit()
    print('COMMIT_OK')
except Exception as e:
    conn.rollback(); print(f'ROLLBACK|{e}'); raise
finally:
    cur.close(); conn.close()
