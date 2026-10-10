# 사주랩 · SAJU LAB

**나를 만나는 작은 연구소.** 루샨이 만든 무료 오픈소스 사주 프로젝트입니다. 실제 만세력 계산을 다정한 한국어 풀이, 다섯 오행 캐릭터와 공유 PNG로 만납니다.

Made with ♡ by Lucian

- 사이트: [사주랩](https://saju.lucianlabs.dev)
- 저장소: [Seokwoooo/saju-lab](https://github.com/Seokwoooo/saju-lab)
- 연락·버그·제안: [GitHub Issues](https://github.com/Seokwoooo/saju-lab/issues). 공개 글에 출생정보나 비밀키를 넣지 마세요.

사이트와 소스 주소는 `lib/site-config.ts`의 `SITE_URL`, `GITHUB_URL`이 기준입니다. 배포·저장소 공개·실제 AI 제공자 성공 여부는 각각 확인해야 합니다. 소스 구현만으로 실운영 Azure BYOK 연결이 검증되었다고 주장하지 않습니다.

## 기능

- 가입·결제 없이 브라우저에서 양력/음력·윤달을 검증하고 실제 사주를 계산합니다. 이름 → 생년월일 → 성별 → 출생시간을 한 단계씩 입력하며, 양력이 기본이고 음력·윤달은 하단의 접힌 설정에서 변경합니다. 이름은 선택이며 계산값에 영향을 주지 않습니다.
- 일간·음양, 네 기둥, 단순 오행 개수, 십신·지장간, 충분한 입력이 있을 때 대운, 한국 현재 연도부터 세운을 제공합니다. 전문 데이터는 기본 화면에서 접어 둡니다.
- 계산된 특성에서 성격·강점·관계·연애·일·돈·올해·긴 흐름·조언의 9개 기본 풀이를 만듭니다. 두 사람의 궁합에도 두 실제 차트를 사용합니다. 공개 문장은 쉬운 한국어이며 기술값은 별도 근거에 표시합니다.
- 입력을 완료하면 최소 계산 특성으로 AI 분석을 자동 시작합니다. 이번 달의 기회·주의·행동과 각각의 이유를 먼저 보여줍니다. 실패·한도 초과 때는 기본 결과임을 표시하고, 취소하면 입력으로 돌아갑니다.
- 한 문장·오행 밸런스·연애·올해·일과 재능·궁합, 6종 PNG를 피드 1080×1350 또는 스토리 1080×1920으로 저장합니다. 미리보기와 저장은 같은 이미지입니다. 이름은 기본 숨김이며 출생일·출생시간은 카드에 넣지 않습니다.
- 고운바탕·Pretendard를 자체 호스팅합니다. 앱에 광고·분석 추적 도구를 추가하지 않았습니다. 플랫폼 접근 로그는 별도입니다.

풀이와 궁합은 전통 상징에 기반한 재미·자기성찰 콘텐츠입니다. 의료·법률·투자 판단이나 미래 사건을 확정하는 도구가 아닙니다.

## 계산 범위와 관례

`manseryeok@2.0.0`을 고정 사용하며 대한민국 출생 기록만 지원합니다. 입력 연도와 음력 변환 후 양력 연도 모두 **1909~2049년**이어야 하며, 양력으로 변환한 출생일은 **한국의 오늘 날짜까지** 허용합니다. 한국의 역사 표준시·서머타임을 IANA `Asia/Seoul`로 UTC에 대응시킨 뒤 **UTC+9 표준시**로 환산합니다. 연주는 입춘, 월주는 월 절입의 실제 순간에 바뀌고, 일주·시주는 환산 시각의 **00:00 자정**을 일 경계로 삼습니다. 23:00에는 일주를 바꾸지 않습니다. 진태양시·경도·균시차 보정은 적용하지 않습니다.

시간 미상은 기록 날짜의 1,440분과 각 유효한 UTC 후보를 모두 확인합니다. 시주·대운을 만들지 않고 일치하지 않는 연주·월주는 `null`로 남깁니다. 과거 시각 보정으로 일주까지 달라지는 날짜는 정확한 시간 확인을 요청합니다. 이 제한은 1909~1911, 1954-03-20~1961-08-09 및 일부 역사 서머타임 구간에 적용됩니다. 존재하지 않는 시각과 두 번 나타나는 시각도 구분합니다.

오행은 확정된 천간·지지 글자 각각 1개의 **단순 개수**입니다. 지장간 가산·계절 가중치·신강약·용신 판정을 하지 않습니다. 총합은 8/6/4/2개가 될 수 있고 십신 합은 일간을 제외한 `elementTotal - 1`입니다. 시간·성별 방향 입력이 충분할 때만 대운을 계산합니다.

정확한 제한 날짜, KASI 공식 조회 증거, 분 단위 절입 정밀도와 비교 라이브러리의 공유 자료 출처는 [엔진 검증 문서](docs/engine-validation.md)에 있습니다. 라이브러리 간 일치는 모든 역사 기록·천문 관측·풀이의 타당성을 입증하지 않습니다.

## 구조

| 경로 | 책임 |
| --- | --- |
| `lib/contracts.ts` | 출생 입력, 계산 차트, 최소 AI 프로필, 풀이·궁합 계약 |
| `lib/saju.ts` | 음양력·한국 시각·절기 경계·만세력·파생 데이터 |
| `lib/local-reading.ts` | 실제 계산에서 파생되는 로컬 풀이와 궁합 |
| `lib/share-card.ts` | 허용된 카드 정보만으로 브라우저 Canvas PNG 생성 |
| `components/saju/`, `app/page.tsx` | 모바일 순차 입력 → 자동 AI 분석 → 이번 달 핵심과 이유 → 상세 풀이 → 카드 |
| `app/faq`, `app/privacy`, `app/about`, `app/terms` | 사용 안내·정보 처리·해석 범위 |
| `lib/server/`, `app/api/` | 모델 경로, 요청·응답 검증, 취소·비용 제한 |
| `db/schema.ts`, `drizzle/` | 출생정보 없는 남용 방지 예약 |
| `public/fonts/` | 자체 호스팅 글꼴과 각각의 OFL 고지 |
| `lib/site-config.ts` | 사이트·저장소·확인된 소셜 링크의 기준 |

Next.js App Router 형태의 React/TypeScript 코드를 Vinext/Vite와 Cloudflare Worker로 빌드합니다. D1은 AI의 비용·남용 제한에 사용하며 기본 계산에는 D1이나 외부 모델 키가 필요하지 않습니다.

## 로컬 실행

Node.js **22.13.0 이상**과 npm을 사용합니다. 저장소 루트에서:

```sh
npm run install:ci
npm run dev
```

일반 macOS/Windows/Linux의 portable 실행은 기본 `http://127.0.0.1:5173`입니다. 포트를 바꾸려면 `npm run dev -- --port 5174`처럼 지정합니다. 실제 주소는 터미널 출력을 확인합니다. 설치를 겹쳐 실행하지 마세요.

Sites의 managed Linux에서는 저장된 실행 프로필에 따라 Vite와 플랫폼 미리보기 감독자를 사용합니다. `.sites-runtime/`, `.vinext/`, `.wrangler/`는 로컬 런타임 상태이며 공개 저장소·배포에 포함하지 않습니다. 이 앱의 사주 기능은 선택적 ChatGPT 인증 헬퍼를 사용하지 않습니다.

## AI 활성화와 비용

기본 `AI_ENABLED=false`입니다. [.env.example](.env.example)에는 변수 이름만 있고 비밀값은 없습니다. `OPENROUTER_API_KEY`와 32자 이상의 무작위 `AI_IP_HMAC_KEY`는 **Worker 비밀값**으로 등록하고 `NEXT_PUBLIC_` 변수에 넣지 않습니다. `SITE_URL`은 실제 HTTPS 원점입니다.

1. OpenRouter 계정에서 가장 적합한 사용 가능한 Azure 모델을 확인하고 `OPENROUTER_AZURE_MODEL`에 **정확한 슬러그**를 설정합니다. Azure BYOK 키·모델·사이트 API-key 필터, 공유용량 fallback 차단 및 BYOK-only 범위, 데이터 정책을 직접 확인해야 합니다. 모델명만으로 연결 성공을 추정하지 않습니다.
   모델 응답이 catalog의 정확한 canonical alias를 쓰면 `OPENROUTER_AZURE_CANONICAL_MODEL`을 검증 후 함께 설정합니다. Azure endpoint가 strict structured output을 지원하면 `AI_PRIMARY_RESPONSE_MODE=json_schema`, JSON object만 지원하면 `json_object`를 사용합니다. 두 모드 모두 같은 서버 응답 검증을 거칩니다. Sol처럼 추론이 필수인 primary는 `AI_PRIMARY_REASONING_EFFORT=low`와 내부 추론 제외를 사용하며, 그 외 endpoint의 기본값과 Luna fallback은 추론을 비활성화합니다.
2. D1 binding `DB`를 준비하고 **해당 환경**에 migration을 적용합니다. 로컬 DB와 hosted DB는 별개입니다. 설정 파일 변경 뒤에는 재빌드해야 합니다.
3. 실제 모델 가격과 `AI_MAX_PROMPT_PRICE_PER_MILLION`, `AI_MAX_COMPLETION_PRICE_PER_MILLION`, `AI_MAX_OUTPUT_TOKENS`, `AI_JOB_RESERVE_USD`를 맞춥니다. 예약 비용은 주 모델 최대 입력·출력 + BYOK 수수료 + 허용된 fallback 한 번을 모두 덮어야 합니다. 부족한 설정은 유료 호출 전에 거부합니다.
4. 계정 경로 확인 후 `AI_AZURE_BYOK_ONLY_CONFIRMED=true`, `AI_ENABLED=true`를 설정합니다. `/api/status`의 가용 여부는 설정·DB 확인이며 실시간 제공자 응답이나 잔액의 증명이 아닙니다.
5. 실제 응답의 provider/model/BYOK/generation/cost 증거를 확인해야 실운영 성공으로 판단합니다. 단위 테스트의 provider fixture는 이를 대신하지 않습니다.

운영 주 경로는 **Azure BYOK `openai/gpt-6.1-sol`**이며 `AI_PRIMARY_REASONING_EFFORT=low`, `AI_PRIMARY_RESPONSE_MODE=json_schema`, canonical alias `openai/gpt-6.1-sol-20260929`를 사용합니다. 2026-10-10의 실제 Sol·Luna Azure 응답에서 provider와 `is_byok=true`를 확인했고 주 모델로 Sol을 선택했습니다. 이 확인은 이후 계정·배포·잔액 상태의 보증은 아닙니다. 주 경로가 실패하면 정확히 `openai/gpt-6-luna`를 **OpenRouter 크레딧**으로 한 번 시도할 수 있습니다. fallback은 실제 `is_byok=false`와 OpenAI provider 증거를 요구하며 다른 모델로 자동 대체하지 않습니다. 주 경로는 Azure 및 `is_byok=true` 증거를 요구합니다.

이용자에게 결제를 요청하지 않으며 사이트가 운영 비용을 부담합니다. D1은 일일 예약 예산 **최대 $20**, 일일 작업 **최대 200개**, IP당 분당 2개/하루 8개, 전체 동시 2개를 원자적으로 검사합니다. 실제 일일 작업 수는 `min(AI_DAILY_CALL_LIMIT, floor(일일 예산 / AI_JOB_RESERVE_USD))`입니다. 작업 예약은 기본 $0.10이며 설정 범위는 $0.04~$20입니다. 실패·취소에도 예약을 유지합니다. 기본 primary 가격 cap은 Azure GPT-6.1 Sol의 입력 $2/M·출력 $10/M에 맞추며 실제 선택 모델과 전체 요청의 최대 비용을 확인한 뒤 활성화합니다.

사용자가 승인한 운영 예산은 **하루 $20이며 lifetime 총액 제한은 없습니다**. 이 사이트 전용 OpenRouter 키에는 일일 $20 reset과 BYOK 사용량 포함을 설정·검증합니다. 최대 48시간의 D1 기록은 UTC 일일 예약을 집계합니다. Azure 자체 청구와 OpenRouter 크레딧·수수료의 범위도 각각 확인해야 하며 예약 비용은 실제 청구 금액과 구분됩니다.

정확한 계약과 최신 설정값은 [AI 운영 문서](docs/ai-operations.md), [.env.example](.env.example)이 기준입니다. 외부 제공자가 가격 제한을 준수하는 경계가 남습니다. 장애·비용 이상·경로 변경 시 `AI_ENABLED=false`로 중지하고 기본 풀이를 유지합니다. 진행 중 요청 취소가 제공자 과금을 항상 중단한다고 보장하지 않습니다.

## 개인정보

출생 입력과 기본 결과는 브라우저 화면 상태에 있으며 앱의 서버 DB·URL·localStorage에 저장하지 않습니다. 입력 완료 시 AI는 오행/음양, 오행·십성 개수, 계절, 시간/경계 확인 상태, 대운의 나이 구간·오행, 분석 연도·세운 오행과 현재 월의 절기 구간·오행·십성을 전송합니다. 마지막 입력 화면에 이 처리를 안내하며 별도 AI 선택 단계는 없습니다. 이름·출생일·출생시각·성별·원본 사주 기둥은 제외합니다.

D1 예약에는 원본 IP 대신 날짜별 HMAC 식별값과 무작위 요청 ID, 요청 증명 해시, 날짜·시각·예약 비용을 씁니다. 출생정보·프로필·풀이를 저장하지 않습니다. 예약은 최대 48시간의 유효기간을 두고 만료 row는 이후 API 요청 때 삭제하므로 실제 삭제 시각이 만료와 같다고 보장하지 않습니다.

앱 진단 로그에는 경로·비용 증거만 남깁니다. 호스팅 접근 로그와 OpenRouter/Azure/OpenAI의 처리는 별도 정책·계정 설정의 범위입니다. 정보 최소화와 라우팅 조건이 완전한 익명성이나 모든 제공자의 무보관을 보증하지 않습니다. 사용자 안내는 `/privacy`에서 확인합니다.

## 검증

최신 결과 화면의 날짜 범위, 실제 단계 기반 진행률, 사전 제작 일러스트와 사진 저장 방식은 [화면과 공유 설계](docs/presentation-and-sharing.md)에 설명합니다.

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

엔진 테스트는 KASI 달력·윤달·일진, 윤년, 입춘/월절입 ±1분, 23:00/자정, 시간 미상, 1954/1961/1988 한국 시각, 범위·최소 AI 계약을 검증합니다. 로컬 문장에는 전문 용어가 공개 화면으로 새어 나오지 않는 회귀 검사가 있습니다. 서버 테스트는 PII·응답 계약, provider 경로 증거, 최대 두 시도, 취소·타임아웃·오류·가격 제한을 검증하며 실제 Miniflare D1에 제한 SQL을 실행합니다. Provider 응답은 fixture이므로 `npm test`에서 유료 호출을 하지 않습니다.

PNG는 실제 저장 파일의 크기·한글·잘림도 검사해야 합니다. 배포 전후 모바일/데스크톱 입력·수정·궁합·AI 실패·카드 저장·안내 페이지를 확인합니다. Node/Vitest의 `DEP0205` 경고가 나타날 수 있으며 종료 코드·실패 내역을 별도로 확인합니다.

## 빌드와 공개

```sh
npm run build
npm start
```

`npm start`는 빌드된 Worker의 **로컬 미리보기**이며 배포하지 않습니다. `dist/server/wrangler.json`과 `.openai/hosting.json`은 Sites 빌드·설정에서 관리합니다. 저장소 공개와 사이트 배포는 별도 작업입니다. 공개 전에 `.env`·키·개인 입력·로그·런타임 상태가 Git에 포함되지 않는지 확인합니다.

Sites 배포에는 해당 플러그인의 빌드·공개 절차를 사용합니다. 배포 성공 후 실제 주소에서 기본 기능·자원·`/api/status`·안내 페이지를 확인하고 기존 `../redesign` 서비스 보존도 별도로 확인합니다. D1 migration 적용, 비밀값 설정, AI 제공자 성공은 사이트 배포 자체로 완료되지 않습니다.

## 라이선스와 출처

프로젝트 코드: [MIT © 2026 Lucian Labs](LICENSE). 외부 라이브러리·글꼴은 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)의 별도 조건을 따릅니다. 고운바탕·Pretendard는 SIL Open Font License 1.1이며 폰트와 고지를 함께 보존해야 합니다.

KASI·IANA·고정 버전 만세력·비교 라이브러리의 범위는 [엔진 검증](docs/engine-validation.md)에, 제공자·비용·데이터 조건은 [AI 운영 계약](docs/ai-operations.md)에 기록합니다.
