from lxml import html as LH

def field_nodes(paragraph):
    fields=[];label='';parts=[]
    if paragraph.text:parts.append(paragraph.text)
    for child in paragraph:
        text=''.join(child.itertext())
        if child.tag=='strong' and text.strip().endswith(':'):
            if parts:fields.append({'label':label,'html':''.join(parts)})
            label=text.rstrip(':');parts=[child.tail or '']
        else:parts.append(LH.tostring(child,encoding='unicode',with_tail=True))
    if parts:fields.append({'label':label,'html':''.join(parts)})
    return fields
