"""03 abandono: hoja ABANDONO (libro inbound), solo septiembre, INSERT anti-duplicado (NO truncar).
Uso: python scripts/etl/03_cargar_abandono.py"""
import os
import pandas as pd
from common import log

XLSX = os.path.join('data', 'raw', 'GasCaribe', 'inbound.xlsx')
HOJA = 'ABANDONO'

def main():
    assert os.path.exists(XLSX), f'Falta {XLSX}.'
    df = pd.read_excel(XLSX, sheet_name=HOJA)
    df.columns = [c.strip() for c in df.columns.astype(str)]
    # TODO: filtrar septiembre por fecha_llamada/fecha base real del Excel tras ver columnas.
    df['hoja_origen'] = HOJA
    log('caribe_abandono', HOJA, len(df), len(df))
    print('DRY_RUN_OK: INSERT anti-duplicado pendiente con xlsx real (t.* IS NOT DISTINCT FROM s.*).')

if __name__ == '__main__':
    main()
