import re,math,json,sys
d=open('flame-only.txt').read().strip()
tokens=re.findall(r'[MmCcSsLlHhVvZz]|-?\d*\.?\d+(?:e-?\d+)?',d)
# parse to absolute segments
segs=[]; i=0; cx=cy=0; sx=sy=0
def num(): 
    global i; v=float(tokens[i]); i+=1; return v
while i<len(tokens):
    t=tokens[i]; i+=1
    if t in 'Mm':
        first=True
        while i<len(tokens) and re.match(r'-?\d*\.?\d+',tokens[i]):
            x=num(); y=num()
            if t=='m': x+=cx; y+=cy
            segs.append(('M' if first else 'L',[x,y])); cx,cy=x,y
            if first: sx,sy=x,y
            first=False
    elif t in 'Cc':
        while i<len(tokens) and re.match(r'-?\d*\.?\d+',tokens[i]):
            p=[num() for _ in range(6)]
            if t=='c': p=[p[0]+cx,p[1]+cy,p[2]+cx,p[3]+cy,p[4]+cx,p[5]+cy]
            segs.append(('C',p)); cx,cy=p[4],p[5]
    elif t in 'Ss':
        while i<len(tokens) and re.match(r'-?\d*\.?\d+',tokens[i]):
            p=[num() for _ in range(4)]
            if t=='s': p=[p[0]+cx,p[1]+cy,p[2]+cx,p[3]+cy]
            segs.append(('S',p)); cx,cy=p[2],p[3]
    elif t in 'Ll':
        while i<len(tokens) and re.match(r'-?\d*\.?\d+',tokens[i]):
            x=num(); y=num()
            if t=='l': x+=cx; y+=cy
            segs.append(('L',[x,y])); cx,cy=x,y
    elif t in 'Hh':
        while i<len(tokens) and re.match(r'-?\d*\.?\d+',tokens[i]):
            x=num(); x = x+cx if t=='h' else x
            segs.append(('L',[x,cy])); cx=x
    elif t in 'Vv':
        while i<len(tokens) and re.match(r'-?\d*\.?\d+',tokens[i]):
            y=num(); y = y+cy if t=='v' else y
            segs.append(('L',[cx,y])); cy=y
    elif t in 'Zz':
        segs.append(('Z',[])); cx,cy=sx,sy
    else: raise SystemExit('unknown '+t)
ys=[p for c,pts in segs for p in pts[1::2]]; ymin,ymax=min(ys),max(ys)
A=float(sys.argv[1]) if len(sys.argv)>1 else 34; B=float(sys.argv[2]) if len(sys.argv)>2 else 22
def warp(x,y,ph):
    amt=((ymax-y)/(ymax-ymin))**0.9
    dx=A*amt*math.sin(ph+y*0.014+x*0.003)
    dy=-B*amt*(0.5+0.5*math.sin(ph*1.31+x*0.011+1.0))
    return x+dx,y+dy
def build(ph):
    out=[]
    for c,pts in segs:
        if c=='Z': out.append('Z'); continue
        q=[]
        for k in range(0,len(pts),2):
            x,y=warp(pts[k],pts[k+1],ph); q+= [x,y]
        out.append(c+' '.join(f'{v:.1f}' for v in q))
    return ''.join(out)
frames=[build(ph) for ph in [k*2*math.pi/6 for k in range(6)]]
base=build(None) if False else None
# frame 0 should be the unwarped path: use zero amplitude frame as rest
A0,B0=A,B; A=B=0; rest=build(0); A,B=A0,B0
json.dump({'rest':rest,'frames':frames},open('frames.json','w'))
grid=''
for n,f in enumerate([rest]+frames):
    open(f'f{n}.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#fff"/><path fill="#F77F00" d="{f}"/></svg>')
print(len(rest), [len(f) for f in frames])
