"""11 abandono septiembre: hoja ABANDONO (libro inbound), INSERT anti-duplicado telefono+fecha.
NO trunca. Requiere data/raw/GasCaribe/Inbound_Caribe.xlsx. Idempotente."""
import os
import re
import pandas as pd
from dotenv import load_dotenv

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(dotenv_path=os.path.join(ROOT, '.env'))
import psycopg2
from psycopg2.extras import execute_values


def parse_es(v):
    if pd.isna(v):
        return pd.NaT
    t = str(v).replace('\u202f', ' ').replace('\xa0', ' ').strip()
    m = re.match(r'(\d{1,2})/(\d{1,2})/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap])\.\s*m\.)?', t)
    if m:
        d, mo, y, h, mi, se, ap = m.groups()
        h = int(h or 0)
        if ap == 'p' and h < 12:
            h += 12
        if ap == 'a' and h == 12:
            h = 0
        try:
            return pd.Timestamp(int(y), int(mo), int(d), h, int(mi or 0), int(se or 0))
        except ValueError:
            return pd.NaT
    return pd.to_datetime(t, errors='coerce', dayfirst=True)


def main():
    xlsx = os.path.join(ROOT, 'data', 'raw', 'GasCaribe', 'Inbound_Caribe.xlsx')
    assert os.path.exists(xlsx), f'Falta {xlsx}'
    da = pd.read_excel(xlsx, sheet_name='ABANDONO')
    f = da['fecha'].map(parse_es)
    sep = da[(f >= '2026-09-01') & (f <= '2026-09-30')].copy()
    sep = sep.assign(_f=f[(f >= '2026-09-01') & (f <= '2026-09-30')].values)
    print(f'ABANDONO_SEP2026|{len(sep)}')
    rows = []
    for _, r in sep.iterrows():
        tel = str(r['numbercall']).replace('\xa0', ' ').strip() if pd.notna(r['numbercall']) else None
        if not tel or not tel.replace('.0', '').replace(' ', '').isdigit():
            continue
        dt = r['_f']
        rows.append((tel.split('.')[0], dt.date(), dt.strftime('%H:%M:%S')))
    print(f'ROWS_CON_TELEFONO|{len(rows)}')
    conn = psycopg2.connect(host=os.getenv('DB_HOST'), port=os.getenv('DB_PORT'), dbname=os.getenv('DB_NAME'),
                            user=os.getenv('DB_USER_ETL'), password=os.getenv('DB_PASSWORD_ETL'), connect_timeout=30)
    conn.autocommit = False
    cur = conn.cursor()
    try:
        cur.execute('CREATE TEMP TABLE tmp_ab(telefono TEXT, fecha_llamada DATE, hora TEXT) ON COMMIT DROP')
        execute_values(cur, 'INSERT INTO tmp_ab VALUES %s', rows, page_size=500)
        cur.execute("""INSERT INTO gestion_diaria.caribe_abandono (telefono, fecha_llamada, hora)
                       SELECT s.telefono::bigint, s.fecha_llamada, s.hora FROM tmp_ab s
                       WHERE NOT EXISTS (SELECT 1 FROM gestion_diaria.caribe_abandono t
                         WHERE t.telefono::text = s.telefono AND t.fecha_llamada = s.fecha_llamada)""")
        print(f'INSERTADOS|{cur.rowcount}')
        conn.commit()
        print('COMMIT_OK')
    except Exception as e:
        conn.rollback()
        print(f'ROLLBACK|{e}')
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == '__main__':
    main()
