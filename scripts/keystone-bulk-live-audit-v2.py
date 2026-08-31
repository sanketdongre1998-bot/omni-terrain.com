#!/usr/bin/env python3
from __future__ import annotations
import importlib.util
from pathlib import Path

BASE = Path('/home/ubuntu/keystone/keystone-bulk-live-audit.py')
if not BASE.exists():
    raise SystemExit(f'Missing base auditor: {BASE}')

spec=importlib.util.spec_from_file_location('omni_bulk_base',BASE)
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

# Exact code sets from Keystone/LKQ eComm Restricted Lines 5.15.26.
# 256 unique vendor codes = 96 website yes + 143 requires authorization + 17 website no.
WEBSITE_YES=set('A27 A4M A78 AC8 ALC ARB B72 B7R B83 B85 BIG BPH BUR C4Q CNT D54 DIO E63 ENJ F7F FSR G20 G22 G3S G75 G7Z G80 GLF GYH H6Z H77 I9A ICM INR K86 KDA KLY LGQ LOK LUM M36 M6U MBA MDW MNS MON MRM MRS MTP MXN NOR O37 P44 P71 P77 PED R2G R6L R90 RCI RDC REN RHR RPI S1G S2K SCV SHS SHU SNP SOL SST SVW T1K T4A T4C T64 T66 TBD TER TES TJM TOW TRP TRU TSW U12 W36 W51 WIL WNJ WSF XGC Y6E ZAR ZRO'.split())
WEBSITE_REQ=set('A1P A1S A3D A4J ACR ADD AMP ARE B1A B1B B1M B63 B65 B6Z B7V B94 BBB BBL BLT BNG BRK BWE C1W C7W C93 C98 C9D CAN CGL CLA CMA CMC CML COB CPV D67 D6J D7E DAV DOD DV8 E18 E6H EPO EVO F71 F72 F7E FLR FUR FUS G26 GAR GAT GCM GLA GOG H21 HUM IMM IVN JLA K47 KEE KUA L22 L32 L57 L77 LEN LEW LND LOW LTC M1B M1D M20 M4J M4V M6V M79 MGD MIN MOB N21 N40 N6C N6D NAV NOH O31 O32 OSG P45 P4V P6W P7P POR R1E R1H R6Q R75 R92 RAY RGL RKT RNH RNM RSI RTO RTX S1C S30 S6U S99 SAW SBC SCH SCO SEK SIM SIO SON SPE SSK STD T22 T4L T6H T70 T7Q TRT U19 U22 U29 U6C V15 VIC VLM W24 W7D WOW Z6E'.split())
WEBSITE_NO=set('A2U ALD ALT C4G C4M C6K CAT DCK G6N G93 I6E O10 POP RVC S8K SFL UNQ'.split())
MAP_YES=set('A1P A1S A27 A2U A3D A4J A4M A78 AC8 ACR ADD ALC ALD ALT AMP ARB ARE B1A B1B B1M B63 B65 B6Z B72 B83 B85 B94 BBB BBL BIG BLT BNG BPH BWE C1W C4G C4M C4Q C7W C93 C98 CAN CGL CLA CMA CML COB CPV D54 D67 D7E DAV DCK DIO DOD DV8 E18 E63 E6H ENJ EPO EVO F71 F72 F7F FLR FSR FUR FUS G22 G26 G3S G6N G75 G7Z G80 G93 GAR GAT GCM GLA GOG GYH H21 H6Z H77 HUM I6E ICM INR IVN JLA K47 K86 KDA KEE KLY KUA L22 L32 L57 L77 LEW LGQ LND LOK LOW LTC LUM M1B M1D M20 M36 M4J M4V M6U M6V M79 MBA MDW MGD MIN MNS MOB MON MRM MTP N21 N40 N6C N6D NAV NOH NOR O10 O31 O32 O37 OSG P44 P45 P4V P6W P71 P77 P7P PED POP POR R1E R1H R2G R6L R75 R90 R92 RAY RDC RGL RHR RKT RNH RNM RPI RSI RTO RTX S1C S1G S2K S30 S8K S99 SAW SBC SCO SCV SEK SFL SHS SHU SIM SIO SNP SOL SON SPE SSK SST STD SVW T1K T22 T4A T4C T4L T64 T66 T6H T70 T7Q TBD TER TJM TRT TRU TSW U19 U22 U29 U6C V15 VIC W24 W36 W51 W7D WIL WNJ WOW WSF XGC Z6E ZAR ZRO'.split())
MAP_NO=set('B7R B7V BRK BUR C6K C9D CAT CMC CNT D6J F7E G20 GLF I9A IMM LEN MRS MXN R6Q RCI REN S6U SCH TES TOW TRP U12 UNQ VLM Y6E'.split())
ALL_RESTRICTED=WEBSITE_YES|WEBSITE_REQ|WEBSITE_NO
assert len(WEBSITE_YES)==96 and len(WEBSITE_REQ)==143 and len(WEBSITE_NO)==17 and len(ALL_RESTRICTED)==256

# Make base summary report the complete policy count.
m.POLICY={code:{} for code in ALL_RESTRICTED}

def classify_policy(row,approval):
    code=m.clean(row.get('VendorCode')) or m.clean(row.get('VCPN'))[:3]
    if code in WEBSITE_NO:
        return False,'WEBSITE_NO',code in MAP_YES,{'website':'No','map':'Yes' if code in MAP_YES else 'No'}
    if code in WEBSITE_REQ:
        separately_approved=m.truthy(approval.get('BrandAuthorized')) and m.truthy(approval.get('ChannelAuthorized'))
        if not separately_approved:
            return False,'WEBSITE_AUTH_REQUIRED',code in MAP_YES,{'website':'Requires Authorization','map':'Yes' if code in MAP_YES else 'No'}
    if code in WEBSITE_YES:
        map_yes=code in MAP_YES
        if map_yes and m.upper(approval.get('MAPVerified')) not in m.MAP_OK:
            return False,'MAP_PRICE_REQUIRED',True,{'website':'Yes','map':'Yes'}
        return True,'RESTRICTED_SHEET_OK',map_yes,{'website':'Yes','map':'Yes' if map_yes else 'No'}
    # The supplier supplied this as its restricted-lines list specifically in response to
    # which manufacturers need online-selling requirements. Unlisted codes are not blindly
    # trusted: they still must pass live account-specific Keystone orderability/shipping.
    return True,'NOT_LISTED_RESTRICTED_SHEET',False,None

m.classify_policy=classify_policy
m.main()
