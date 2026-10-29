"""The page's photograph of itself (cd-self-src-data): the page without its photograph, its getter, and the Forge it
carries (cd-forge-dress and cd-forge-pack). photo(page) builds it; rephoto(page) puts a fresh one in place."""
import re,base64,gzip
DATA_OPEN='<script type="cd/b64" id="cd-self-src-data">'
def _cut(x,open_re,eat_nl=False):
    m=re.search(open_re,x)
    if not m: raise SystemExit('block not found: '+open_re)
    a=m.start(); b=x.find('</script>',m.end())+len('</script>')
    if eat_nl and x[b:b+1]=='\n': b+=1
    if eat_nl and a>0 and x[a-1:a]=='\n': a-=1
    return x[:a],x[b:]
def photo(page):
    x=page
    pre,post=_cut(x,re.escape(DATA_OPEN)); x=pre+post
    pre,post=_cut(x,r'<script id="cd-self-src">'); x=pre+post
    pre,post=_cut(x,r'<script id="cd-forge-dress" type="text/plain">',True); x=pre+post
    pre,post=_cut(x,r'<script id="cd-forge-pack" type="text/plain">',True); x=pre+post
    return x
def rephoto(page):
    raw=photo(page)
    gz=bytearray(gzip.compress(raw.encode('utf-8'),9,mtime=0)); gz[9]=0xff   # the header the page's own maker writes
    enc=base64.b64encode(bytes(gz)).decode('ascii')
    a=page.find(DATA_OPEN); b=page.find('</script>',a)
    return page[:a+len(DATA_OPEN)]+enc+page[b:]
def current(page):
    a=page.find(DATA_OPEN); b=page.find('</script>',a)
    return gzip.decompress(base64.b64decode(page[a+len(DATA_OPEN):b].strip())).decode('utf-8')
