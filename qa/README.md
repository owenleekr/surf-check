# 화면 검증 스크립트

실제 Supabase 에 연결하지 않는다. 모든 서버 응답은 스크립트 안의 목업이고, 쓰기 요청은 가로채서 내용만 검사한다.

## 준비 (한 번)

```bash
cd qa && npm install          # puppeteer-core 설치 (Chrome 은 시스템에 있는 것을 쓴다 — macOS 경로가 코드에 고정)
cd .. && python3 -m http.server 8765 &     # 저장소 루트를 8765 로 연다
```

## 실행

```bash
node qa/race.mjs      # 동시 합류 — 차량·숙소·번개에서 사람이 사라지거나 정원이 넘지 않는지
node qa/leak.mjs      # 공개 표로 나가는 쓰기에 birth(비번 재설정 인증값)·도감 데이터가 없는지
node qa/xss.mjs       # 남의 도감 값에 HTML 을 넣어도 실행되지 않는지
node qa/xss2.mjs      # 숙소·정보판 url(javascript:, 따옴표 탈출)·후기 별점
node qa/schoolxss.mjs # 라인업(school.html) 마을·채팅·번개·후기 이스케이프
node qa/play.mjs      # 레벨·퀘스트·도감·게임 전체 흐름
node qa/game2.mjs     # 게임: 일시정지·소리·자랑하기 / qa/hls.mjs: 캠 영상 도구 지연 로딩
node qa/load.mjs      # 불러오기 상태 — 로딩·신호 실패·표 없음
node qa/audit.mjs     # 글자 크기·터치 영역·가로 넘침 (390·320px)
node qa/contrast.mjs  # 글자 대비
node qa/a11y.mjs      # 대화창 포커스 이동·가두기·복귀
node qa/onb.mjs       # 새 소식 카드 + 온보딩 11단계가 실제 요소를 가리키는지
node qa/vill.mjs      # 마을 캐릭터·이름표·말풍선 겹침
node qa/quiz.mjs      # 코치 퀴즈: 5문제 흐름·하루 XP 상한(10)·배지
node qa/daily.mjs     # 오늘의 챌린지: 같은 코스(결정성)·구명튜브·순위·악성 dbest 무시
node qa/emote.mjs     # 마을 이모트: 허용 목록·12초 소멸·연타 방지·공개 행 미복사
node qa/shop.mjs      # 조개 상점: 구매·잔액 부족·랜덤이 안 산 걸 안 뽑는지
node qa/stamp.mjs     # 해변 스탬프 + XP 떠오름 / qa/fun.mjs: 운세·만석 축하·숨은 보너스
node qa/signup.mjs    # 신규 가입 전 과정 / qa/school_smoke.mjs: 라인업 6개 탭·채팅·체크인
node qa/goal.mjs mvp.mjs tour.mjs   # 협동 목표·MVP·탭 전체 스크린샷(/tmp)
```

운영 서버를 보려면 `BASE=https://surf.owenai.xyz node qa/prod.mjs` 처럼 `BASE` 를 준다 (mock.mjs 사용 스크립트).

## 규칙
- 서버가 돌려주는 값이 *남이 쓴 값*이면 화면에 찍기 전에 `esc()`/숫자 변환을 거친다 — `xss*.mjs` 가 그걸 지킨다.
- 공개 표에 프로필을 쓸 땐 `pubSelf()`/`pubRow()`(서프쉐어), `pubPf()`(라인업)을 거친다 — `leak.mjs` 가 지킨다.
