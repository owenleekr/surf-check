# 카카오 로그인 — SurfShare에서 시작해 학교까지 한 계정으로

목표한 흐름은 이렇습니다.

```
① SurfShare 입장 → 아이디·비번으로 가입 → 차·숙소·평가를 올린다
                          ↓  (며칠 뒤, 아무 때나)
② "카카오로 묶어두기" 한 번  →  ①에서 올린 게 전부 그대로 따라온다
                          ↓
③ 학교(/school)가 열리면 카카오 한 번으로 들어간다. 데이터는 이미 거기 있다
```

**②에서 옮겨지는 데이터는 없습니다.** 그게 이 설계의 요점이라 먼저 적습니다.

---

## 왜 데이터를 안 옮겨도 되나

지금 모든 표가 `wavekim` 같은 **글자 아이디**를 가리킵니다.

```
rides.user_id · stays.user_id · stay_reviews.user_id · poses.user_id
surfers.id · cards.from_id · checkins · parties · ratings · reacts.user_id
```

카카오를 붙일 때 흔히 하는 실수가 키를 카카오 uuid로 갈아치우는 것입니다.
그러면 위 표를 **전부 동시에** 고쳐야 하고, 하나라도 어긋나면 남의 차에 내가 타 있게 됩니다.

그래서 키는 건드리지 않고, `accounts` 행에 **카카오 신분만 매답니다**.

```
accounts
  id         'wavekim'        ← 모든 표가 가리키는 값. 안 바뀐다
  pw         bcrypt…          ← 그대로 쓸 수 있다
  kakao_uid  9f3c-…(uuid)     ← 여기만 새로 붙는다
```

로그인 문이 둘이 되고, 들어오면 같은 방입니다.

---

## 오웬이 할 것 — ①~⑦

### ① 카카오 개발자 앱 만들기
https://developers.kakao.com → `내 애플리케이션` → `애플리케이션 추가하기`

| 칸 | 값 |
|---|---|
| 앱 이름 | **라인업** |
| 회사명 | 이성현 |
| 카테고리 | 스포츠 |

### ② 플랫폼 등록
`앱 설정` → `플랫폼` → **Web 플랫폼 등록**

```
https://surf.owenai.xyz
```

### ③ 카카오 로그인 ON + Redirect URI
`제품 설정` → `카카오 로그인` → 활성화 **ON**, 그 화면의 Redirect URI에:

```
https://tneidzyhriefzubkajkv.supabase.co/auth/v1/callback
```

> surf.owenai.xyz가 아니라 **supabase.co**인 게 맞습니다. 카카오가 답을 돌려주는 자리는
> Supabase입니다. Supabase가 다시 우리 페이지로 보냅니다.

### ④ 동의항목
`제품 설정` → `카카오 로그인` → `동의항목`

| 항목 | 설정 |
|---|---|
| 닉네임 `profile_nickname` | **필수 동의** |
| 프로필 사진 `profile_image` | 선택 동의 |
| 이메일 `account_email` | **건너뜁니다** — 사업자(Biz App) 전환해야 열립니다 |

이메일을 안 받아도 됩니다. 우리는 카카오 고유번호(uuid)로만 사람을 알아보면 되고,
연락은 어차피 단톡방으로 합니다.

### ⑤ 앱 정보에 약관 주소
`앱 설정` → `앱 정보`

```
이용약관        https://surf.owenai.xyz/terms-of-service
개인정보처리방침  https://surf.owenai.xyz/privacy
```

### ⑥ Supabase에 키 넣기
`앱 설정` → `앱 키` 의 **REST API 키**, 그리고 `카카오 로그인` → **Client Secret**(활성화 ON 후 발급).

Supabase 대시보드 → `Authentication` → `Providers` → **Kakao**
- Enable: ON
- Client ID: REST API 키
- Client Secret: 발급받은 값

> ⚠️ **두 값 다 저에게 보내지 마세요.** 제 코드는 그 값을 몰라도 됩니다.

### ⑦ 돌아올 주소 허용 ← 빠뜨리면 여기서 막힙니다
`Authentication` → `URL Configuration` → **Redirect URLs** 에 두 줄:

```
https://surf.owenai.xyz/surfshare
https://surf.owenai.xyz/school
```

여기 없는 주소로는 Supabase가 안 돌려보냅니다. ③의 Redirect URI와 **다른 설정**입니다
(③은 카카오→Supabase, ⑦은 Supabase→우리 페이지).

### ⑧ SQL 한 번
`SQL Editor` 에 [supabase-kakao.sql](supabase-kakao.sql) 을 통째로 붙여넣고 Run.

끝나면 알려주세요. 거기서부터 제 차례입니다.

---

## 제가 할 것 — ⑧ 끝난 뒤

### 서버 (SQL에 이미 들어 있음)

| 함수 | 언제 |
|---|---|
| `kakao_whoami()` | 카카오로 들어옴 → 물려 둔 계정이 있나 확인 |
| `link_kakao(id, token)` | **쓰던 계정에 카카오를 매단다** ← ②단계의 핵심 |
| `kakao_signup(id, name, profile)` | 카카오로 처음 온 사람에게 새 계정 |
| `unlink_kakao(id, token)` | 연결 끊기 |
| `set_pw(id, token, new)` | 카카오만 쓰던 사람이 비번을 새로 정할 때 |

`link_kakao` 는 **두 가지를 동시에** 요구합니다 — ① 그 계정의 토큰을 갖고 있을 것
② 지금 그 카카오로 로그인돼 있을 것. 하나만으로는 남의 계정에 내 카카오를 못 붙입니다.

> SQL에 `login()` 수정도 같이 들어 있습니다. 카카오 전용 계정은 `pw` 가 null인데
> 지금 코드는 `r.pw <> crypt(p_pw, r.pw)` 로 비교합니다. null 비교 결과는 false가 아니라
> **null** 이라 `if` 가 안 걸리고 아무 비밀번호나 통과합니다. 붙이기 **전에** 막습니다.

### 화면
1. SurfShare 헤더 · 꾸미기 탭에 **"카카오로 묶어두기"** (노란 규격 버튼)
   - 이미 로그인한 상태에서 누름 → 카카오 갔다 옴 → `link_kakao` → "이제 카카오로 들어오셔도 됩니다"
   - 저장된 토큰이 없으면(예전에 가입한 분) 비밀번호를 한 번 더 받습니다
2. 로그인 화면에 **"카카오로 시작하기"** → `kakao_whoami`
   - 물려 있음 → 바로 입장
   - 처음 → 이름 확인하고 아이디 정해서 `kakao_signup`
   - **"쓰던 아이디가 있어요"** 로 빠져 기존 계정에 붙이는 길도 같이 둡니다
3. 학교(`/school`) 로그인 화면도 같은 버튼. 같은 `accounts` 를 보므로 그대로 들어옵니다
4. 연결 끊기 + 비번 없는 계정 보호 (비번부터 정하게)
5. 약관·개인정보처리방침에 **카카오에서 받는 정보(닉네임·프로필 사진·고유번호)** 추가

### 라이브러리
`supabase-js` 를 CDN으로 부를지, OAuth 왕복을 직접 짤지는 붙일 때 정합니다.
지금 앱은 CDN 의존이 폰트뿐이고 `sprite.js` 하나 못 받아도 죽었던 적이 있어서,
**직접 짜는 쪽(약 40줄)** 으로 기울어 있습니다. 대신 PKCE 동작을 실측해 보고 정하겠습니다.

---

## 미리 해 둔 것

SurfShare가 로그인 토큰을 **버리고** 있었습니다(`ME` 에 안 담았음). 그게 없으면
②단계에서 "이 계정이 내 것"임을 증명할 물건이 비밀번호밖에 없어서, 카카오 묶을 때
비밀번호를 또 받아야 했습니다. 지금은 보관합니다.

이미 가입하신 분들은 저장된 게 없으니, 카카오를 묶을 때 비밀번호를 한 번 더 받습니다.
(한 번 다시 로그인하면 그 뒤로는 안 물어봅니다.)
