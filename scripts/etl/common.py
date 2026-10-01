"""Comun ETL: conexion .env + helpers. No imprime secretos."""
import os
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
import psycopg2

MESES_INBOUND = ["Enero 2026", "Febrero 2026", "Marzo 2026", "Abril 2026",
                 "Mayo 2026", "Junio 2026", "Julio 2026", "Agosto 2026",
                 "Septiembre 2026"]

def conn():
    return psycopg2.connect(host=os.getenv('DB_HOST'), port=os.getenv('DB_PORT'),
                            dbname=os.getenv('DB_NAME'), user=os.getenv('DB_USER_ETL'),
                            password=os.getenv('DB_PASSWORD_ETL'), connect_timeout=20)

def log(tabla, hoja, leidas, insertadas):
    print(f"{tabla}|{hoja}|leidas={leidas}|insertadas={insertadas}")
