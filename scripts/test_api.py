import urllib.request
import json
req = urllib.request.Request('http://localhost:4323/api/GasCaribe/gestion/productos?anio=2026&mes=9')
try:
    r = urllib.request.urlopen(req)
    data = json.loads(r.read().decode())
    print('Total products:', len(data))
    for d in data:
        total = d["inbound"] + d["outbound"]
        print(f'  {d["producto"]}: inbound={d["inbound"]}, outbound={d["outbound"]}, total={total}')
except Exception as e:
    print(f'Error: {e}')