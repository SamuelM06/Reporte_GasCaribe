"""02 outbound: hoja outbound, filtro fecha 2026-01-01 a 2026-09-30 -> stg -> TRUNCATE + INSERT.
Uso: python scripts/etl/02_cargar_outbound.py
Requiere: data/raw/GasCaribe/outbound.xlsx
La columna fecha puede venir mixta (2026-01-14 y 26/01/2026): se parsea con dayfirst=True."""
import os
import pandas as pd
from common import conn, log

XLSX = os.path.join('data', 'raw', 'GasCaribe', 'outbound.xlsx')
HOJA = 'outbound'
RENAME_MAP = {'RESULTADO DE RETENCION': 'estado', 'FECHA BASE': 'fecha_de_ejecucion'}

def main():
    assert os.path.exists(XLSX), f'Falta {XLSX}. Descargalo del link EXCEL_OUTBOUND_URL del .env.'
    df = pd.read_excel(XLSX, sheet_name=HOJA)
    df.columns = [c.strip() for c in df.columns.astype(str)]
    df = df.rename(columns=RENAME_MAP)
    assert 'fecha_de_ejecucion' in df.columns, f'Sin columna fecha. Columnas: {list(df.columns)}'
    df['fecha_de_ejecucion'] = pd.to_datetime(df['fecha_de_ejecucion'], dayfirst=True, errors='coerce')
    antes = len(df)
    df = df[(df['fecha_de_ejecucion'] >= '2026-01-01') & (df['fecha_de_ejecucion'] <= '2026-09-30')]
    df['hoja_origen'] = HOJA
    log('caribe_outbound', HOJA, antes, len(df))
    print(f'TOTAL_EXCEL_OUTBOUND_ENE_SEP|{len(df)}')
    print('DRY_RUN_OK: falta INSERT a staging + TRUNCATE (con xlsx real).')

if __name__ == '__main__':
    main()
