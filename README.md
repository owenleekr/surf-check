# 라인업 (LINEUP) — 오늘 파도 어때

양양서핑학교 6기 파도 체크 · 미션 · 레벨. 단일 `index.html`, 빌드 없음.

- 파도·바람·수온·조위: Open-Meteo (키 없음, 브라우저 직접 호출)
- 캠: WSB FARM 웨이브캠 링크
- 계정·진도: 브라우저 localStorage (기기별). 레벨 탭 "데이터 옮기기"로 이전

## 6기 랭킹·칭찬 카드 공유 (Supabase)

기본은 각자 폰에만 저장된다. 기수 전원이 같은 랭킹과 카드를 보려면:

1. supabase.com → New project (무료) 생성
2. SQL Editor → `supabase.sql` 내용 전체 붙여넣고 Run
3. Project Settings → API 의 **Project URL** 과 **anon public** key를 `config.js`에 넣고 push

앱은 진도가 바뀔 때마다 자기 행을 upsert하고, 6기 탭에서 XP 순으로 읽는다. 칭찬 카드는 받는 사람 이름 기준으로 도착한다.
친구 그룹용이라 행 보호는 느슨하다(누구나 갱신 가능). 로그인 자체는 여전히 기기별이며, 폰을 바꾸면 레벨 탭 "데이터 옮기기"로 옮긴다.

## 서버 계정 (어느 폰에서든 로그인)

`supabase-accounts.sql`을 SQL Editor에서 실행하면 계정이 서버(bcrypt)로 가고, 앱은 자동으로 서버 계정을 쓴다.
실행 전엔 기기별 로컬 계정으로 동작. 전체 리셋은 그 파일 맨 아래 주석의 `delete from …` 한 줄.

## 파도 별점 · 체크인 · 파티 모집 (3차)

`supabase-social.sql` 실행됨(2026-09-20). 테이블: ratings·checkins·parties·tides. 별점은 0.5 단위 5점, 저장 시 그 시각의 차트(파고·주기·바람·조위·판정)를 함께 저장해
"비슷한 차트일 때 실제 평점"을 판정 옆에 보여준다. 체크인은 4시간 뒤 자동 해제, 파티는 당일만 노출.

## 데이터 소스
- 파도: Open-Meteo Marine, 모델 4종 동시 수신(기본 MFWAM·GFS Wave·DWD GWAM·Météo-France). 앱 안에서 전환·비교.
- 바람·기온·일출몰: Open-Meteo Forecast(ECMWF/ICON 통합). 수온·조위: 기본 모델 고정.
- 물때 공식값: 코치가 파도 탭 기준 카드에서 입력(`tides` 테이블) → 전원 브리핑에 반영.
- 다음 후보: 기상청 API허브 파고부이 실측(키 필요), 쿠팡 파트너스 링크(`config.js` shop).

## 용어 정확도 관리 (학교 기준 맞추기)
앱의 핵심 표현은 `LEX_SEED`(index.html) 한 곳에 모아두고, 각 항목에 **출처**(강의노트 / 단톡 코칭 날짜 / 일반 용어 / 앱 제안)를 단다.
`supabase-terms.sql` 실행 후 수업 탭 "용어 검수"에서 **코치가 표현·설명을 고쳐 저장하면 앱 전체가 즉시 그 표현으로 바뀐다**(판정·바람·스웰·물때·동작).
멤버는 같은 화면에서 "고쳐주세요"로 신고 → 코치 검수 큐(status=fix)에 쌓인다.
