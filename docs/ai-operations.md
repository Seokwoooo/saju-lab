# AI 운영 계약

AI는 선택 기능이다. 기본 계산과 로컬 풀이는 AI 설정·잔액·제공자 성공 여부와 독립적이다. 로그인이나 가입은 없다. `AI_ENABLED` 기본값은 `false`이며 비밀키, D1, 허용된 모델, 사이트 원점, Azure BYOK 전용 경로 확인 중 하나라도 빠지면 AI API는 503을 반환한다. `/api/status`는 `{ "available": false | true }`만 공개한다. availability는 설정과 D1 스키마를 확인하며 잔액·실시간 제공자 상태를 유료 호출로 탐지하지 않는다.

## 활성화와 비밀값

`.env.example`에 정확한 이름이 있다. `OPENROUTER_API_KEY`와 최소 32문자의 무작위 `AI_IP_HMAC_KEY`는 Worker 비밀값으로 등록한다. `NEXT_PUBLIC_` 변수를 사용하지 않는다. `SITE_URL`은 실제 HTTPS 사이트의 원점이다. HTTP는 loopback 개발 주소만 허용한다. `OPENROUTER_AZURE_MODEL`은 Azure BYOK 키가 허용하는 정확한 `provider/model` 슬러그다. 운영자가 Azure에서 실제 사용 가능한 모델의 품질, 배포 가능 여부, OpenRouter 연결을 확인해 가장 좋은 primary 모델을 선택한다. 기존 계정의 저비용 preset이 있다는 사실만으로 그 모델을 최선의 primary로 선택하지 않는다.

OpenRouter 계정에서 다음을 직접 확인한 뒤 `AI_AZURE_BYOK_ONLY_CONFIRMED=true`와 `AI_ENABLED=true`로 설정한다.

- Azure 키의 허용 모델에 primary 모델을 포함한다.
- 키의 API-key 필터에 이 사이트의 OpenRouter 키를 포함한다.
- primary Azure 키를 prioritized 경로로 두고 해당 모델의 공유 Azure 용량 fallback을 비활성화한다. OpenRouter의 BYOK-only 계정 설정이 적용되는 범위를 확인한다. `provider.only`만으로 BYOK를 증명할 수 없다.
- OpenAI fallback은 OpenRouter 크레딧을 사용하도록 계정의 OpenAI BYOK 적용 범위를 확인한다. 서버는 `is_byok=false` 증거가 없으면 fallback 결과를 거부한다.
- 사용자가 승인한 하루 $20 예산에 맞춰 이 사이트 전용 OpenRouter API key에 일일 $20 limit, daily reset과 BYOK 사용량 포함을 설정하고 실제 적용을 확인한다. lifetime 총액 제한은 두지 않는다. D1도 별도로 UTC 일일 $20 예약 상한을 적용한다.
- OpenRouter 입력·출력 로깅이 비활성화되어 있는지 확인한다. 앱은 출생정보와 결과를 로깅하지 않는다.

공유용량을 응답 후 거부하는 것만으로 잘못된 경로의 과금을 사전에 막을 수 없으므로 계정의 BYOK-only 설정이 활성화 선행 조건이다. 확인 플래그는 운영자의 감사 상태를 반영하는 설정이며 서버는 응답의 실제 BYOK 여부를 별도로 검증한다.

`AI_PRIMARY_RESPONSE_MODE`는 `json_schema`(기본) 또는 `json_object`다. Azure endpoint가 `response_format`만 지원하고 `structured_outputs`를 지원하지 않으면 `json_object`로 설정한다. 이 경우 전체 strict 출력 schema를 메시지에 명시하고 서버의 동일한 Zod/근거/문장 검증을 반드시 통과해야 한다. fallback은 항상 strict `json_schema`를 사용한다.

`OPENROUTER_AZURE_CANONICAL_MODEL`은 public model catalog의 `canonical_slug`를 확인한 뒤 등록하는 선택 설정이다. 실제 응답 model은 요청 slug 또는 이 정확한 별칭 하나만 허용하며, 별칭은 같은 provider/model 이름에 suffix가 붙은 형태여야 한다. 임의 다른 모델이나 자동 라우터는 허용하지 않는다.

2026-10-10의 public OpenRouter catalog 확인에서는 `deepseek/deepseek-v4-pro`의 canonical slug가 `deepseek/deepseek-v4-pro-20260423`이며 Azure endpoint `azure/us`는 prompt $1.91/M, completion $3.83/M와 `response_format`을 지원하고 `structured_outputs`는 나열하지 않았다. 이 모델을 운영자가 실제 Azure 배포/BYOK로 확인해 선택할 때는 primary mode `json_object`, 위 canonical alias, 가격 cap 1.91/3.83, 작업 예약 $0.1, 출력 3,200 tokens 설정을 사용할 수 있다. 현재 catalog와 키 적용 범위는 배포 직전에 다시 확인한다.

운영자가 2026-10-10에 확인한 Azure GPT-6.1 Sol 경로는 `openai/gpt-6.1-sol`, canonical alias `openai/gpt-6.1-sol-20260929`, `json_schema`, 입력 $2/M·출력 $10/M cap을 사용한다. GPT-6 Luna의 확인된 alias는 `openai/gpt-6-luna-20260922`이며 Azure primary로 선택할 때도 실제 BYOK 증거를 요구한다. 고정 OpenRouter 크레딧 fallback은 `openai/gpt-6-luna`로 요청한다. 기본 $0.10 예약은 실제 엔진의 시간 확인/미상 프로필과 Sol 주 경로 + Luna fallback의 보수적인 최대 비용을 검증한다. 프로필이나 token cap을 늘리면 요청 전 계산을 다시 통과해야 한다.

2026-10-10의 운영자 실호출에서는 Sol `gen-1791620234-GctO5dWC2LeNdh1jAiTX`와 Luna `gen-1791620124-mLwXdXBnpHNWHZYYPxvE`가 모두 Azure, `is_byok=true`로 응답했다. 보고된 upstream inference cost는 각각 $0.016526, $0.0007938이다. Sol은 low effort 설정을 사용한다. 운영 주 경로는 Sol로 선택하며, 이 호출 시점의 연결·사용량 증거와 실제 Azure 청구서, 이후의 가용성은 구분한다. 실제 OpenAI 크레딧 fallback도 별도 호출에서 `is_byok=false`와 9개 section 검증 성공을 확인했다.

Azure 배포의 TPM/RPM 용량도 확인한다. 작은 BYOK probe 성공은 전체 풀이가 사용 가능하다는 증거가 아니다. 전체 메시지·출력 schema의 입력 token 수와 최대 출력 token 수를 합한 한 요청을 수용해야 하며, 운영 목표는 최소 약 10,000 TPM와 예상 동시 요청을 수용하는 RPM이다. 실제 전체 풀이로 확인한다. 1,000 TPM/1 RPM처럼 작은 기존 할당은 전체 요청에 429를 반환할 수 있다. 용량 확인과 변경은 지출 상한 변경과 별개다.

## API와 브라우저 요청

모든 응답은 `Cache-Control: no-store`, `nosniff`, 동일 출처 자원 정책을 사용한다. POST는 canonical `Origin`, `application/json`을 요구하고 압축 본문은 거부한다. CORS 허용 헤더는 없다. AI 요청 본문은 헤더를 신뢰하지 않고 스트리밍으로 최대 12,288바이트를 읽는다.

1. `GET /api/status`에서 `available`을 확인한다.
2. `GET /api/challenge`는 `{ "challenge": { "token": "...", "difficulty": 14, "expiresAt": 0 } }`를 반환한다. 만료 시각은 Unix milliseconds다.
3. 십진수 문자열 nonce를 증가시키며 UTF-8 `${token}:${nonce}`의 SHA-256이 앞에서부터 14개의 0 비트를 갖는 값을 찾는다. nonce는 1~20자리다. 모바일에서는 작업을 나누거나 Web Worker에서 계산하고 취소를 지원한다. challenge는 발급 후 5분, 발급 IP의 그날 HMAC에 묶인다. 자정 경계에 만료되면 새 challenge를 요청한다.
4. `POST /api/analyze`에 `{ "profile": AIProfile, "proof": { "token": "...", "nonce": "123" } }`를 보낸다. JSON 외 추가 필드, 임의 문자열, 이름, 생년월일, 출생시각, 성별, 사주 기둥을 보내지 않는다. proof를 생략하면 `CHALLENGE_REQUIRED`다.
5. 성공은 `{ "reading": Reading }`이며 `reading.source`는 서버가 `ai`로 설정한다. 실패는 `{ "error": "한국어 안내", "code": "...", "retryAfter": seconds? }`다. 한도 실패는 429와 `Retry-After` 헤더를 반환한다. 실패·취소 후 기본 풀이를 유지한다.

`profile`은 version 1, 오행/음양 enum, 0~8의 정수 count, 10개의 정확한 한국어 십성 label, 허용된 계절, boolean 경계/시간 상태, 최대 10개 시기, 최대 12개 연도만 허용한다. 오행 합은 2/4/6/8이며 시간 미상은 최대 6이다. 월주가 없으면 계절은 `절기 경계 미확정`이다. 연도는 1900~2200 및 analysisYear부터 +20 이내다. 나이 구간은 0~120, 순서가 맞고 서로 겹치지 않는 최대 10년 구간이다.

근거 ID는 `day-element`, `polarity`, `season`, `time-known`, `boundary-uncertain`, `element:wood|fire|earth|metal|water`, `ten-god:비견` 등 실제 포함된 label, `annual:2026` 등 실제 연도, `cycle:0` 등 실제 배열 인덱스다. 9개 section은 personality/strengths/relationships/love/career/money/year/cycles/advice다. year는 annual 근거를, 실제 cycle이 있으면 cycles는 cycle 근거를 요구한다.

## 분산 제한과 D1

`.openai/hosting.json`의 logical D1 binding은 `DB`다. `db/schema.ts` 변경 뒤 `npm run db:generate`로 생성한 schema-only migration을 확인한다. 로컬 D1과 hosted D1은 별개다. 운영자가 해당 환경의 migration 적용 완료를 확인해야 한다. 요청 중 테이블을 만들거나 migration을 실행하지 않는다.

`ai_reservations`는 무작위 request ID, challenge hash, 날짜별 keyed IP HMAC, UTC day key, 생성/만료/동시성 임대 시각과 보수적인 예약 비용만 저장한다. 원본 IP, 출생정보, 프로필, 결과, provider payload를 저장하지 않는다. IP HMAC은 UTC 날짜마다 바뀐다. row는 다음 UTC 자정부터 24시간 후 만료하므로 보유 기간은 최대 48시간이다. 모든 API 요청은 만료 row를 삭제한다.

한 개의 SQLite `INSERT ... SELECT ... WHERE ... RETURNING` 문이 아래 조건을 모두 검사하고 성공 시 예약한다. D1 write serialization을 사용하므로 여러 Worker가 검사와 삽입 사이에 다른 예약을 끼워 넣을 수 없다. read-then-increment가 아니다.

- 전역 UTC 일일 최대 200개 AI 작업, 일일 $20 예약 상한. 실제 작업 한도는 `min(AI_DAILY_CALL_LIMIT, floor(일일 예산 / 작업 예약))`다.
- IP당 rolling 60초 2개, UTC 일일 8개. 자정 직후에는 현재·전날 keyed IP HMAC을 조회하여 날짜별 hash 교체로 분당 제한을 우회하지 못하게 한다. 저장 row에는 당일 hash 하나만 남긴다.
- 전역 동시 작업 2개, 임대 TTL 120초.
- 이미 사용된 challenge hash는 재사용 불가.
- 작업마다 `AI_JOB_RESERVE_USD` 전체 예약(기본 $0.10, 설정 범위 $0.04~$20). primary 실패/취소/timeout도 예약 비용은 환불하지 않는다.

예약 row가 최대 200개/일로 제한되어 조회·정리가 작고 유한하다. 성공/실패/클라이언트 취소 모두 `finally`에서 임대만 해제한다. DB 해제 실패 시 120초 임대 만료까지 보수적으로 점유한다. 작업 TTL은 primary 45초와 fallback 25초의 최대 70초 합보다 길다. DB 오류는 fail closed다.

`AI_DAILY_CALL_LIMIT`와 `AI_DAILY_BUDGET_USD`는 기본 상한보다 낮출 수 있다. per-IP/동시성 상한은 코드에서 고정한다. 작업 예약은 일일 예산 이하여야 하며 비싼 Azure 모델의 양쪽 lane 최대 비용을 덮도록 설정한다. 하루 $20 예산에서 $0.5 예약은 일일 최대 40개다. 기본 $0.10 예약은 최대 200개다. 더 낮은 작업 예약을 사용하더라도 코드의 200개 상한을 넘지 않는다.

## 제공자, 비용, 출력

최대 2개의 유료 generation만 수행한다. primary는 환경의 Azure 모델 + `provider.only=["azure"]`, `allow_fallbacks=false`, `require_parameters=true`, `data_collection="deny"`다. primary의 실제 model, Azure provider 및 `is_byok=true`가 확인되어야 성공으로 취급한다. 증거가 없으면 3초 내 `/generation?id=...` 조회를 딱 한 번 수행한다. 비용 차이나 upstream cost가 있다는 사실만으로 BYOK라고 추론하지 않는다.

fallback은 정확히 `openai/gpt-6-luna` + `only=["openai"]`, `ignore=["azure"]`, `allow_fallbacks=false`로 요청하며 실제 `is_byok=false`를 확인한다. 응답 model은 요청 slug 또는 검증된 동일 모델의 dated alias `openai/gpt-6-luna-20260922` 하나만 허용한다. 다른 모델로 대체하지 않는다. 모델이 계정에서 제공되지 않거나 잔액이 부족하면 실패로 반환한다.

primary 전체 제한은 45초, fallback은 25초이며 헤더 수신 뒤 본문 읽기와 metadata 확인도 포함한다. fetch에 AbortSignal을 전달하고 클라이언트 취소 시 추가 lane을 실행하지 않는다. 클라이언트 취소로 upstream 과금이 항상 멈춘다고 보장하지 않으므로 예약은 유지한다.

`AI_PRIMARY_REASONING_EFFORT`는 `none`(서버 기본), `low`, `medium`, `high`만 허용한다. `none`은 `reasoning: { enabled: false }`를 요청한다. Sol처럼 추론을 끌 수 없는 endpoint는 운영 예제의 `low`를 사용하며 `reasoning: { effort: "low", exclude: true }`를 전송한다. fallback은 항상 `reasoning: { enabled: false }`다. 내부 추론은 API나 로그에 내보내지 않는다. 추론이 활성화된 primary도 3,200 기본 출력 token 상한과 45초 primary 전체 timeout, 동일한 예약 예산을 적용하며 추론 token은 제공자의 completion 상한에 포함되어야 한다. 해당 endpoint의 파라미터 지원과 전체 응답을 실제로 확인한다.

기본 출력 상한은 3,200 tokens이며 설정 범위는 1,000~3,500이다. primary에는 설정된 max_price(기본 prompt $2/M, completion $10/M), fallback에는 고정 prompt $0.1/M, completion $0.5/M를 적용한다. 양쪽 모두 request $0로 단건 추가 가격을 차단한다. 서버는 JSON schema와 메시지의 UTF-8 byte 수 및 여유 512 tokens를 보수적인 입력 token 상한으로 사용해 primary 최대 비용 + primary의 5% BYOK fee + fallback 최대 비용이 `AI_JOB_RESERVE_USD` 이내인지 요청 전에 확인한다. 설정으로 이 예산을 넘으면 유료 호출 없이 503으로 실패한다. primary 가격 설정의 코드 상한은 prompt $100/M, completion $200/M이며 입력이 큰 프로필에서 예약을 넘는 조합은 거부한다. 실제 선택 모델 가격을 검증한 뒤 그 모델을 수용하는 가격 cap과 작업 예약을 설정한다. 예약 검사를 우회하거나 다른 모델로 바꾸지 않는다. 실제 응답 비용도 점검한다. 외부 제공자가 가격 제한을 준수한다는 경계는 남는다.

출력은 schema를 명시하며 지원 endpoint에서는 strict JSON schema를 요구한다. json_object 경로에서도 결과를 동일하게 Zod로 검사한다. wire schema와 prompt는 headline 2~70자, intro 2~300자, title 2~40자, body 2~450자, tip 2~120자와 evidence 1~5개를 명시한다. wire pattern은 한국어 포함, 한자·HTML 꺾쇠 제외를 요구한다. year/cycles는 해당 연도/시기 ID만 선택하도록 schema를 좁힌다. `source`는 모델이 보낼 수 없다. 9개 섹션/짧은 한국어/유효한 근거 ID/길이 제한을 검사하며 HTML, 코드, 링크, 한자와 사주 전문용어, 없는 연도·정확한 날짜·출생시각·기둥·확정적 질병/죽음/수익 주장, 명시적인 오행·십성 수/일간/연도 오행 불일치를 거부한다. 나무·불·흙·쇠·물과 일상 언어로 설명하도록 요청한다. 문자열 패턴 검사와 근거 ID 검사는 자유 문장 전체의 의미적 정답을 증명하지 않는다. 풀이를 전통적 자기 성찰 자료로 표시하고 계산 결과가 별도 기준으로 남아야 한다.

문체 목표는 특징에 근거한 정체성 headline, 다정한 해요체, section당 약 120~220자의 짧은 3문장이다. 특징·조건부 일상 장면·강점과 부담의 균형을 연결하며 각 tip은 행동 하나로 끝낸다. 관계·연애·일·돈은 서로 다른 관점으로 설명한다. 문화적 해석 안내는 intro에 모으고, 실제 시간/경계 불확실성이나 빈 시기 자료의 제한만 필요한 곳에서 알린다. 이 문체 목표를 위해 기존 최대 길이·검증·3,200 token 상한을 유지한다. primary 45초·fallback 25초 제한은 실제 응답 지연을 근거로 별도로 적용한다.

앱 진단 로그에는 무작위 request ID, model, provider, 실제 BYOK boolean, generation ID, cost와 upstream cost를 남긴다. 실패 시에는 요청 model/provider, HTTP status와 서버가 정한 고정 reason code를 추가한다. Zod 실패는 최대 8개의 `validationIssues`에 서버 schema의 허용된 field path와 정적 issue code/rule만 기록한다. 알 수 없는 key는 `?`, 배열 인덱스는 `[]`로 가리고 값·메시지·알 수 없는 key 이름은 기록하지 않는다. 예: `{"path":"intro","code":"too_big"}`, `{"path":"sections.love.body","code":"custom","rule":"NO_HANJA"}`. UNSUPPORTED_AI_CLAIM도 같은 형식으로 실제 match가 시작된 안전한 field path와 정적 rule만 기록한다. rule은 기둥/출생정보, 정확한 날짜/시각, 확정적 수익·의료·운명 주장, 전문용어, 없는 연도, 수치·연도 오행 불일치를 구분한다. 문장 검사 조건과 순서는 유지하며 값을 기록하지 않는다. 제공자 오류 본문은 길이를 제한해 분류만 하고 메시지를 로그로 내보내지 않는다. 프롬프트·응답·원본 IP·hash·출생정보를 로그로 내보내지 않는다. 플랫폼의 접근 로그 설정은 별도로 관리한다.

## 검증 범위와 운영 중지

`tests/limits.test.ts`와 `tests/api-integration.test.ts`는 실제 Miniflare D1에 SQL을 실행한다. API/AI 테스트의 provider 응답은 fetch fixture이므로 실제 Azure 연결·OpenRouter 청구 검증은 아니다. 외부 유료 호출은 단위/통합 테스트에서 실행하지 않는다.

장애, 비용 이상, 경로 설정 변경 시 `AI_ENABLED=false`로 즉시 비활성화한다. `/api/status` false와 analyze 503을 확인한다. 호출이 이미 진행 중이면 과금이 완전히 취소된다고 가정하지 않는다. 기존 기본 풀이는 계속 사용한다.

참고: [OpenRouter provider routing](https://openrouter.ai/docs/guides/routing/provider-selection), [BYOK](https://openrouter.ai/docs/guides/overview/auth/byok), [generation metadata](https://openrouter.ai/docs/api/api-reference/generations/get-generation), [usage accounting](https://openrouter.ai/docs/cookbook/administration/usage-accounting), [OpenAI supported structured-output schema](https://developers.openai.com/api/docs/guides/structured-outputs), [Cloudflare D1 atomic write/batch semantics](https://developers.cloudflare.com/d1/worker-api/d1-database/).
