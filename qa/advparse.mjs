/* 기상특보 해석(api/advisory.js) — 브라우저 없이. 기상청 getPwnStatus 응답 모양 그대로의 픽스처로
   양양 구역 특보만 골라내는지, 경남 고성·먼바다·건조주의보는 빼는지, 키 오류·자료 없음·키 없음 처리 */
import assert from 'assert';
import handler, { parseStatus, parseResponse } from '../api/advisory.js';
const wrap = (t6, code = '00', tmFc = 202610181000) => ({ response:{ header:{ resultCode:code, resultMsg:'NORMAL_SERVICE' }, body:{ dataType:'JSON', items:{ item:[{ tmFc, tmSeq:12, t6, t7:'o 없음' }] }, totalCount:1 } } });
const FIX = {
  active: wrap('o 풍랑주의보 : 동해중부안쪽먼바다, 동해중부바깥먼바다, 강원북부앞바다, 강원중부앞바다\r\no 강풍주의보 : 강원도(양양군평지, 속초시평지, 고성군평지, 강릉시평지, 강원북부산지), 울릉도.독도\r\no 건조주의보 : 강원도(양양군평지, 강릉시평지)'),
  warn: wrap('o 풍랑경보 : 강원북부앞바다\r\no 호우주의보 : 강원특별자치도(양양평지, 북부산지)'),
  far: wrap('o 풍랑주의보 : 동해중부바깥먼바다, 강원남부앞바다\r\no 강풍주의보 : 경상남도(고성, 통영), 강원도(삼척시평지)\r\no 건조주의보 : 강원도(양양군평지)'),
  none: wrap('o 없음'),
  nodata: { response:{ header:{ resultCode:'03', resultMsg:'NO_DATA' } } },
  bad: { response:{ header:{ resultCode:'30', resultMsg:'SERVICE_KEY_IS_NOT_REGISTERED_ERROR' } } },
  oneLine: wrap(' o 태풍주의보 : 강원중부앞바다 o 대설경보 : 강원도(고성평지)'),
};
let r = parseResponse(FIX.active);
assert.equal(r.ok, true); assert.equal(r.tmFc, '202610181000');
assert.deepEqual(r.active.map(x=>x.kind), ['풍랑주의보', '강풍주의보']);
assert.deepEqual(r.active[0].areas, ['강원북부앞바다', '강원중부앞바다']);
assert.deepEqual(r.active[1].areas, ['양양평지', '속초평지', '고성평지', '강릉평지']);
r = parseResponse(FIX.warn);
assert.equal(r.active[0].kind, '풍랑경보'); assert.equal(r.active[0].lvl, '경보'); assert.deepEqual(r.active[1].areas, ['양양평지']);
assert.deepEqual(parseResponse(FIX.far).active, [], '경남 고성·강원남부·먼바다·건조는 빼야 한다');
assert.deepEqual(parseResponse(FIX.none), { ok:true, active:[], tmFc:'202610181000' });
assert.deepEqual(parseResponse(FIX.nodata).active, []);
assert.equal(parseResponse(FIX.bad).ok, false);
assert.equal(parseResponse(null).ok, false);
assert.deepEqual(parseResponse(FIX.oneLine).active.map(x=>x.kind + ':' + x.areas.join()), ['대설경보:고성평지', '태풍주의보:강원중부앞바다']);
assert.deepEqual(parseStatus(''), []);
/* 키 없음 → ok:false nokey (기상청을 부르지 않는다) */
delete process.env.KMA_SERVICE_KEY;
let got = null, hd = {};
await handler({ query:{} }, { setHeader:(k, v)=>{ hd[k] = v; }, status(c){ return { json:o=>{ got = { c, o }; } }; } });
assert.equal(got.o.ok, false); assert.equal(got.o.reason, 'nokey'); assert.match(hd['Cache-Control'], /s-maxage/);
/* 기상청이 XML 오류를 주면 → ok:false api */
process.env.KMA_SERVICE_KEY = 'abc+def/=='; let url = '';
globalThis.fetch = async u=>{ url = u; return { ok:true, text:async ()=>'<OpenAPI_ServiceResponse><cmmMsgHeader><errMsg>SERVICE ERROR</errMsg></cmmMsgHeader></OpenAPI_ServiceResponse>' }; };
await handler({ query:{} }, { setHeader(){}, status(c){ return { json:o=>{ got = { c, o }; } }; } });
assert.equal(got.o.reason, 'api'); assert.ok(url.includes('serviceKey=abc%2Bdef%2F%3D%3D'), 'Decoding 키는 한 번 감싼다');
process.env.KMA_SERVICE_KEY = 'abc%2Bdef';
globalThis.fetch = async u=>{ url = u; return { ok:true, text:async ()=>JSON.stringify(FIX.active) }; };
await handler({ query:{} }, { setHeader(){}, status(c){ return { json:o=>{ got = { c, o }; } }; } });
assert.ok(url.includes('serviceKey=abc%2Bdef&'), 'Encoding 키는 그대로'); assert.equal(got.o.active.length, 2);
console.log('advparse OK');
