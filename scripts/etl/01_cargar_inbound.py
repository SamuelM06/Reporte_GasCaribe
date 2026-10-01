"""01 inbound: recorre las 9 hojas ene-sep 2026 -> stg -> TRUNCATE + INSERT.
Uso: python scripts/etl/01_cargar_inbound.py
Requiere: data/raw/GasCaribe/inbound.xlsx
NO truncar si el xlsx no existe o conteos no cuadran (aborta antes).
Mapeo: columna Excel RESULTADO DE RETENCION -> BD estado (si el Excel trae otro
nombre, ajustar RENAME_MAP tras ver 00_diagnosticar)."""
import os
import pandas as pd
from common import conn, log, MESES_INBOUND

XLSX = os.path.join('data', 'raw', 'GasCaribe', 'inbound.xlsx')
# Ajustar tras diagnostico del Excel. Clave: nombre Excel -> nombre BD.
RENAME_MAP = {
    'RESULTADO DE RETENCION': 'estado',
    'FECHA BASE': 'fecha_de_ejecucion',
}

def main():
    assert os.path.exists(XLSX), f'Falta {XLSX}. Descargalo del link EXCEL_INBOUND_URL del .env.'
    xls = pd.ExcelFile(XLSX)
    faltan = [m for m in MESES_INBOUND if m not in xls.sheet_names]
    assert not faltan, f'Hojas faltantes en Excel: {faltan}. Hojas vistas: {xls.sheet_names}'
    dfs = []
    for hoja in MESES_INBOUND:
        df = pd.read_excel(xls, sheet_name=hoja)
        df.columns = [c.strip() for c in df.columns.astype(str)]
        df = df.rename(columns=RENAME_MAP)
        df['hoja_origen'] = hoja
        log('caribe_inbound', hoja, len(df), len(df))
        dfs.append(df)
    full = pd.concat(dfs, ignore_index=True)
    print(f'TOTAL_EXCEL_INBOUND_9MESES|{len(full)}')
    # TODO: insert a stg_caribe_inbound con psycopg2/extras.execute_values,
    # validar conteo por hoja_origen = conteo Excel, y solo entonces:
    # BEGIN; TRUNCATE caribe_inbound; INSERT SELECT desde staging; COMMIT.
    print('DRY_RUN_OK: falta implementar INSERT (siguiente paso con xlsx real).')

if __name__ == '__main__':
    main()
