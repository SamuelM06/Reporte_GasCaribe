"""Fase 2 real: TRUNCATE + recarga inbound (9 hojas 2026) y outbound (fecha base ene-sep 2026).
Mapeo Excel -> BD documentado en context/Esquema_BD.md. Abandono NO se toca (hoja sin datos mapeables)."""
import os, re, unicodedata
import pandas as pd
from dotenv import load_dotenv
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(dotenv_path=os.path.join(ROOT, '.env'))
import psycopg2
from psycopg2.extras import execute_values

IN = os.path.join(ROOT, 'data', 'raw', 'GasCaribe', 'Inbound_Caribe.xlsx')
OUT = os.path.join(ROOT, 'data', 'raw', 'GasCaribe', 'Outbound_Caribe.xlsx')
HOJAS2026 = ['ENERO 2026','FEBRERO 2026','MARZO 2026','ABRIL 2026','MAYO 2026','JUNIO 2026','JULIO 2026','AGOSTO 2026','SEPTIEMBRE 2026 ']

def norm(c):
    c = str(c).replace('\xa0',' ').strip().lower()
    c = ''.join(ch for ch in unicodedata.normalize('NFD', c) if unicodedata.category(ch) != 'Mn')
    c = re.sub(r'[^a-z0-9]+','_',c).strip('_')
    return c

def parse_fecha(s):
    d = pd.to_datetime(s, errors='coerce', dayfirst=True)
    return None if pd.isna(d) else d.date()

def clean_estado(v):
    if pd.isna(v): return None
    return str(v).replace('\xa0',' ').strip() or None

def s(v):
    if pd.isna(v): return None
    t = str(v).replace('\xa0',' ').strip()
    return t or None

# ---------- INBOUND ----------
xls = pd.ExcelFile(IN)
frames = []
for hoja in HOJAS2026:
    df = pd.read_excel(xls, sheet_name=hoja)
    df.columns = [norm(c) for c in df.columns]
    # quitar Unnamed
    df = df[[c for c in df.columns if not c.startswith('unnamed')]]
    # unificar duplicados (observacion x2): quedarnos con primero no nulo
    df = df.T.groupby(level=0).first().T
    n = len(df)
    get = lambda *names: next((df[c] for c in names if c in df.columns), pd.Series([None]*n))
    fecha_col = 'fecha_de_atencion' if 'fecha_de_atencion' in df.columns else None
    res_col = 'resultado_de_retencion' if 'resultado_de_retencion' in df.columns else ('estado' if 'estado' in df.columns else None)
    out = pd.DataFrame({
        'aseguradora': get('aseguradora').map(s),
        'contrato': get('contrato').map(s),
        'localidad': get('localidad').map(s),
        'operador': get('operador').map(s),
        'canal': get('canal').map(s),
        'producto': get('producto').map(s),
        'tipo_de_contacto': get('tipo_de_contacto').map(s),
        'estado': df[res_col].map(clean_estado) if res_col else None,
        'subtipificacion': get('tipifiacion_de_la_retencion','tipificacion_de_la_retencion').map(s),
        'motivo': get('obsevaci_n','observaci_n','obsevacion','observacion').map(s),
        'fecha_de_ejecucion': df[fecha_col].map(parse_fecha) if fecha_col else None,
        'fecha_de_venta': get('fecha_de_venta').map(parse_fecha),
        'asesor_de_venta': get('asesor_de_venta').map(s),
        'mes': hoja.strip(),
        'anio': 2026,
        'telefono': get('telefono').map(s),
        'documento': get('documento').map(s),
        'usuario': get('usuario').map(s),
        'gestor': get('gestor').map(s),
        'correo_reintegro': get('correo_para_reintegro','correo_reintegro').map(s),
        'gestion_sac': get('gestion_sac').map(s),
        'numero_solicitud': get('numero_de_solicitud').map(s),
        'observacion_sac': get('observacion_sac').map(s),
        'fecha_legalizacion': get('fecha_de_legalizacion').map(parse_fecha),
    })
    frames.append(out)
    print(f'INBOUND|{hoja.strip()}|{len(out)}')
full_in = pd.concat(frames, ignore_index=True)
print(f'INBOUND_TOTAL_9HOJAS|{len(full_in)}')

# ---------- OUTBOUND ----------
xo = pd.ExcelFile(OUT)
do = pd.read_excel(xo, sheet_name='Outbound')
do.columns = [norm(c) for c in do.columns]
do = do.T.groupby(level=0).first().T
fb = pd.to_datetime(do['fecha_de_base'], errors='coerce', dayfirst=True)
mask = (fb >= '2026-01-01') & (fb <= '2026-09-30')
print(f'OUTBOUND_TOTAL_HOJA|{len(do)}|ENE_SEP2026|{int(mask.sum())}|FUERA_O_NULA|{int((~mask).sum())}')
do = do[mask].copy()
fb = fb[mask]
n = len(do)
get = lambda *names: next((do[c] for c in names if c in do.columns), pd.Series([None]*n))
fll = pd.to_datetime(get('fecha_de_llamada'), errors='coerce', dayfirst=True) if 'fecha_de_llamada' in do.columns else pd.Series([pd.NaT]*n)
out = pd.DataFrame({
    'aseguradora': get('aseguradora').map(s),
    'contrato': get('contrato').map(s),
    'operador': get('operador').map(s),
    'canal': get('canal').map(s),
    'producto': get('producto').map(s),
    'tipo_de_contacto': get('tipo_de_contacto').map(s),
    'estado': get('resultado_de_retencion').map(clean_estado),
    'subtipificacion': get('tipifiacion_de_la_retencion','tipificacion_de_la_retencion').map(s),
    'motivo': get('observacion').map(s),
    'fecha_de_ejecucion': fll.map(lambda d: None if pd.isna(d) else d.date()),
    'base': do['fecha_de_base'].map(s),
    'fecha_de_venta': get('fecha_de_venta').map(parse_fecha),
    'asesor_de_venta': get('asesor_de_venta').map(s),
    'mes': fb.dt.month.map(lambda m: ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE'][m-1] + ' 2026'),
    'anio': 2026,
    'gestor': get('gestor_de_retencion').map(s),
    'gestion_sac': get('gestion_sac').map(s),
    'numero_solicitud': get('numero_de_solicitud').map(s),
    'solicitud': get('solicitud').map(s),
    'fecha_registro': get('fecha_registro').map(parse_fecha),
    'cod_estado': get('cod_estado').map(s),
    'observacion_retencion': get('observacion_de_retencion').map(s),
    'fecha_gestion': get('fecha_de_gestion').map(parse_fecha),
})
print(f'OUTBOUND_LISTO|{len(out)}')

# ---------- CARGA BD ----------
conn = psycopg2.connect(host=os.getenv('DB_HOST'),port=os.getenv('DB_PORT'),dbname=os.getenv('DB_NAME'),
                        user=os.getenv('DB_USER_ETL'),password=os.getenv('DB_PASSWORD_ETL'),connect_timeout=30)
conn.autocommit = False
cur = conn.cursor()
try:
    nuevas_in = {'telefono':'TEXT','documento':'TEXT','usuario':'TEXT','gestor':'TEXT','correo_reintegro':'TEXT',
                 'gestion_sac':'TEXT','numero_solicitud':'TEXT','observacion_sac':'TEXT','fecha_legalizacion':'DATE'}
    for c,t in nuevas_in.items():
        cur.execute(f'ALTER TABLE gestion_diaria.caribe_inbound ADD COLUMN IF NOT EXISTS {c} {t}')
    nuevas_out = {'gestor':'TEXT','gestion_sac':'TEXT','numero_solicitud':'TEXT','solicitud':'TEXT',
                  'fecha_registro':'DATE','cod_estado':'TEXT','observacion_retencion':'TEXT','fecha_gestion':'DATE'}
    for c,t in nuevas_out.items():
        cur.execute(f'ALTER TABLE gestion_diaria.caribe_outbound ADD COLUMN IF NOT EXISTS {c} {t}')
    print('ALTER_OK')
    # pandas convierte None->NaN en concat; psycopg2 guardaria 'NaN' en TEXT. Revertir:
    full_in = full_in.astype(object).where(pd.notna(full_in), None)
    out = out.astype(object).where(pd.notna(out), None)
    cur.execute('TRUNCATE gestion_diaria.caribe_inbound')
    cols_in = list(full_in.columns)
    execute_values(cur, f"INSERT INTO gestion_diaria.caribe_inbound ({','.join(cols_in)}) VALUES %s",
                   [tuple(r) for r in full_in.itertuples(index=False)], page_size=1000)
    print(f'INSERT_INBOUND|{len(full_in)}')
    cur.execute('TRUNCATE gestion_diaria.caribe_outbound')
    cols_out = list(out.columns)
    execute_values(cur, f"INSERT INTO gestion_diaria.caribe_outbound ({','.join(cols_out)}) VALUES %s",
                   [tuple(r) for r in out.itertuples(index=False)], page_size=1000)
    print(f'INSERT_OUTBOUND|{len(out)}')
    conn.commit()
    print('COMMIT_OK')
except Exception as e:
    conn.rollback()
    print(f'ROLLBACK|{e}')
    raise
finally:
    cur.close(); conn.close()
