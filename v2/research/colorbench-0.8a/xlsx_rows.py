"""Memory-bounded reader for the exact worksheet consumed by ColorBench.
Only file parsing differs from load_combvd_from_xlsx; rows/columns/units are identical.
"""
from pathlib import PurePosixPath
import zipfile,xml.etree.ElementTree as ET
NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

def load_combvd_xlsx(path):
    with zipfile.ZipFile(path) as z:
        strings=[]
        if 'xl/sharedStrings.xml' in z.namelist():
            for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si',NS):
                strings.append(''.join(t.text or '' for t in si.iter('{'+NS['s']+'}t')))
        wb=ET.fromstring(z.read('xl/workbook.xml'))
        sheet=next(s for s in wb.findall('s:sheets/s:sheet',NS) if s.attrib['name']=='COM_Corrected_UNWEIGHTED')
        rid=sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
        rels=ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        target=next(r.attrib['Target'] for r in rels if r.attrib['Id']==rid)
        target=target.lstrip('/') if target.startswith('/') else 'xl/'+target
        records=[];dataset=None
        with z.open(target) as f:
            for event,row in ET.iterparse(f,events=['end']):
                if row.tag!='{'+NS['s']+'}row':continue
                if int(row.attrib.get('r','0'))<4:row.clear();continue
                vals={}
                for c in row.findall('s:c',NS):
                    col=''.join(ch for ch in c.attrib['r'] if ch.isalpha())
                    v=c.find('s:v',NS)
                    if c.attrib.get('t')=='inlineStr':value=''.join(t.text or '' for t in c.iter('{'+NS['s']+'}t'))
                    elif v is None or v.text is None:value=None
                    elif c.attrib.get('t')=='s':value=strings[int(v.text)]
                    else:
                        try:value=float(v.text)
                        except ValueError:value=v.text
                    vals[col]=value
                if vals.get('A'):dataset=vals['A']
                r=[vals.get(c) for c in 'BCDEFGHIJK']
                if r[0] is not None and None not in r:
                    records.append({'dataset':dataset,'dv':r[0],'white':[x/100 for x in r[1:4]],'xyz1':[x/100 for x in r[4:7]],'xyz2':[x/100 for x in r[7:10]]})
                row.clear()
    return records
