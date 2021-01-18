import re, json, ast

#source of this info: Natural Sciences Tripos Part IA
# MATERIALS SCIENCE data book, stored in separate file
s = open('data_book_info.dat').read().replace('–', '-')

rows = re.findall('.*?(?:\n(?=[a-z])|$)', s, re.DOTALL)
structs = []
for s in rows:
    s = s.replace('\n','')
    if not s: continue
    columns = []
    i = next(i for i in range(len(s)) \
        if s[i+1].isupper() or s[i+1] == '-')
    columns.append(s[:i])
    columns += s[i:].split()[0:3]
    motif = ''.join(s[i:].split()[3:]).strip().replace(' ','')
    elements = re.findall('[A-z][a-z]?.*?(?=[A-Z]|$)', motif)
    if not elements: # in case of hcp, bcc, ccp
        elements = ['X:'+motif]
    def process_num(x):
        if not re.match('[0-9+\-./]*$', x): # assert only valid maths, before eval
            raise ValueError('Invalid number to process!!'+x)
        return eval(x)
    def process_coords(cds):
        # cds is a string like "±(u,u,0);±(1/2+u,1/2–u,1/2)(u≈0.30)"
        if 'u' in cds:
            u = process_num(cds[cds.index('≈')+1:cds.rindex(')')].strip())
            cds = cds.replace('u', '%.3f' % u)
            cds = cds[:cds.rindex('(')]
        coords = []
        if cds.endswith(';'): cds = cds[:-1]
        for pos in cds.split(';'):
            if pos.startswith('±'):
                pos = pos[2:-1] #remove round brackets
                coords.append(tuple(process_num(x) for x in pos.split(',')))
                coords.append(tuple(-process_num(x) for x in pos.split(',')))
            else:
                coords.append(tuple(process_num(x) for x in pos.split(',')))
        return coords
    elements = {
        el[:el.index(':')] : process_coords(el[el.index(':')+1:])
        for el in elements
    }
    columns.append(elements)
    structs.append(columns)

print(json.dumps(structs))
