import urllib.request
import json
req = urllib.request.Request('http://localhost:4323/api/GasCaribe/gestion/gestion-mensual')
try:
    r = urllib.request.urlopen(req)
    data = json.loads(r.read().decode())
    print('Sample rows:')
    for d in data[:3]:
        print('  mes:', d.get('mes'))
except Exception as e:
    print(f'Error: {e}')