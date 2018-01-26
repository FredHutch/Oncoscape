#!/usr/bin/env python

import sys
import urllib
import urllib2
import json
import time

#http://rest.ensembl.org/
class EnsemblRestClient(object):
    def __init__(self, server='http://rest.ensembl.org', reqs_per_sec=15):
        self.server = server
        self.reqs_per_sec = reqs_per_sec
        self.req_count = 0
        self.last_req = 0

    def perform_rest_action(self, endpoint, hdrs=None, params=None):
        if hdrs is None:
            hdrs = {}

        if 'Content-Type' not in hdrs:
            hdrs['Content-Type'] = 'application/json'

        if params:
            endpoint += '?' + urllib.urlencode(params)

        data = None

        # check if we need to rate limit ourselves
        if self.req_count >= self.reqs_per_sec:
            delta = time.time() - self.last_req
            if delta < 1:
                time.sleep(1 - delta)
            self.last_req = time.time()
            self.req_count = 0
        
        try:
            request = urllib2.Request(self.server + endpoint, headers=hdrs)
            response = urllib2.urlopen(request)
            content = response.read()
            if content:
                data = json.loads(content)
            self.req_count += 1

        except urllib2.HTTPError, e:
            # check if we are being rate limited by the server
            if e.code == 429:
                if 'Retry-After' in e.headers:
                    retry = e.headers['Retry-After']
                    time.sleep(float(retry))
                    self.perform_rest_action(endpoint, hdrs, params)
            else:
                sys.stderr.write('Request failed for {0}: Status code: {1.code} Reason: {1.reason}\n'.format(endpoint, e))
           
        return data

    def get_variants(self, species, symbol):
        genes = self.perform_rest_action(
            '/xrefs/symbol/{0}/{1}'.format(species, symbol), 
            params={'object_type': 'gene'}
        )
        if genes:
            stable_id = genes[0]['id']
            variants = self.perform_rest_action(
                '/overlap/id/{0}'.format(stable_id),
                params={'feature': 'variation'}
            )
            return variants
        return None
    
    def transform_external_symbol(self,species, in_id, in_type, out_type):
        genes = self.perform_rest_action(
            '/xrefs/symbol/{0}/{1}'.format(species, in_id)
            ,params={'external_db': in_type}
            #,params={'db_type': in_type, 'external_db': out_type}
        )
        if genes:
            ens_id = genes[0]['id']
            return client.transform_ensembl_id(ens_id, out_type)
            
        return None

    def transform_external_id(self,species, in_id, in_type, out_type):
        genes = self.perform_rest_action(
            '/xrefs/name/{0}/{1}'.format(species, in_id)
            ,params={'external_db': in_type}
            #,params={'db_type': in_type, 'external_db': out_type}
        )
        if genes:
        #    return genes
            stable_id = genes[0]['display_id']
            return stable_id
        
        return client.transform_external_symbol(species, in_id, in_type, out_type)
    
    def transform_ensembl_id(self, ens_id, out_type):
        genes = self.perform_rest_action(
            '/xrefs/id/{0}'.format(ens_id), 
            params={'external_db': out_type}
        )
        if genes:
            stable_id = genes[0]['display_id']
            return stable_id
        return None



def print_variants(species, symbol):
    
    variants = client.get_variants(species, symbol)
    if variants:
        for v in variants:
            print '{seq_region_name}:{start}-{end}:{strand} ==> {id} ({consequence_type})'.format(**v);

def transform_ids(species, in_ids, in_type, out_type):
    print in_ids
    out_ids = []
    if(in_type == "Ensembl"):
        for in_id in in_ids:
            out_ids.append(client.transform_ensembl_id(in_id, out_type))
    elif(in_type in ["CCDS", "MIM_GENE"]):
        for in_id in in_ids:
            out_ids.append(client.transform_external_symbol(species, in_id, in_type, out_type))
    else: 
       for in_id in in_ids:
            out_ids.append(client.transform_external_id(species, in_id, in_type, out_type))
    

    return out_ids

def remove_duplicates(ids):
    seen = set()
    uniq = []
    dup = []
    for x in ids:
        if x not in seen:
            uniq.append(x)
            seen.add(x)
        else:
            uniq.append(None)
            dup.append(x)
    strict_no_dup = [x if x not in dup else None for x in uniq]
    return strict_no_dup

if __name__ == '__main__':
    if len(sys.argv) == 5:
        # python ID_conversion.py 'human' 'ENSG00000157764','ENSG00000157765' 'Ensembl' 'HGNC'
        # python ID_conversion.py 'human' 'BRAF','MYCL1','MYCL' 'HGNC' 'HGNC'
        # python ID_conversion.py 'human' '335','4609','100' 'EntrezGene' 'HGNC'
        # python ID_conversion.py 'human' CCDS6359.2 'CCDS' 'HGNC'
        # python ID_conversion.py 'human' 190080 'MIM_GENE' 'HGNC'
        # python ID_conversion.py 'human' P01106 'Uniprot_gn' 'HGNC'

        species, in_ids, in_type, out_type = sys.argv[1:]
        in_ids = in_ids.split(',')
    else:
        #species, in_ids, in_type, out_type = 'human', ['BRAF'], 'HGNC', 'Ensembl'
        species, in_ids, in_type, out_type = 'human', ['ENSG00000157764'], 'Ensembl', 'HGNC'
    client = EnsemblRestClient()
    ids = transform_ids(species, in_ids, in_type, out_type)
    uids = remove_duplicates(ids)
    print uids
    # only operates on Gene level IDs: Ensembl, HGNC, EntrezGene, CCDS, MIM_Gene, Uniprot_gn