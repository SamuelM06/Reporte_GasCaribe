import urllib.request
import re

req = urllib.request.Request('http://localhost:4323/gestion-diaria')
try:
    r = urllib.request.urlopen(req)
    html = r.read().decode()
    
    islands = re.findall(r'<astro-island[^>]*>.*?</astro-island>', html, re.DOTALL)
    for island in islands:
        if 'GestionApp' in island:
            print('Found GestionApp island:')
            props_match = re.search(r'props="([^"]*)"', island)
            if props_match:
                print('Props:', props_match.group(1)[:500])
            break
except Exception as e:
    print('Error:', e)