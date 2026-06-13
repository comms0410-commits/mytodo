# 오늘AI 플래너 — 제품 기획서

## 1. 제품 한 줄 설명
직접 입력, 자연어, 음성으로 오늘의 할 일을 빠르게 수집하고 AI가 날짜·시간·중요도·프로젝트로 정리해 주며, 매일 주요 AI 뉴스까지 확인하는 개인 생산성 웹 서비스.

## 2. 목표 사용자
- 해야 할 일이 자주 떠오르지만 정리하는 과정이 번거로운 학생과 직장인
- 한국어 자연어로 빠르게 계획을 입력하고 싶은 사용자
- 매일 AI 업계의 중요한 변화를 짧게 확인하고 싶은 사용자

## 3. 핵심 가치
1. **수집 속도**: 한 문장에 여러 할 일을 말해도 목록으로 분리한다.
2. **오늘 집중**: 오늘 보기와 완료율로 현재 할 일만 선명하게 보여 준다.
3. **개인 키 보안**: 비밀키를 소스나 GitHub에 포함하지 않는다.
4. **AI 정보 습관**: 최신 AI 뉴스를 업무 화면 안에서 확인한다.

## 4. MVP 범위

### 4.1 할 일 관리
- 할 일 직접 추가
- 마감 날짜와 중요도 선택
- 완료/완료 취소
- 삭제
- 전체/진행 중/완료 필터
- 오늘/관리함/다음 일정/프로젝트 보기
- 브라우저 localStorage 저장

### 4.2 AI 자연어 정리
입력 예시:
> 오늘 오후 5시까지 AI 수업 자료 초안을 만들고 내일 오전 10시에 선생님께 검토를 요청해. 첫 번째는 최우선이고 둘 다 학교 프로젝트야.

AI 출력 스키마:
```json
{
  "summary": "2개의 할 일을 정리했습니다.",
  "tasks": [
    {
      "title": "AI 수업 자료 초안 만들기",
      "description": "",
      "dueDate": "YYYY-MM-DD",
      "dueTime": "17:00",
      "priority": 1,
      "project": "학교",
      "labels": ["AI"]
    }
  ]
}
```

### 4.3 음성 입력
- Web Speech API `SpeechRecognition` 사용
- 언어는 `ko-KR`
- 인식된 텍스트를 AI 입력창에 채운 뒤 사용자가 확인하고 전송
- 미지원 브라우저에서는 음성 버튼 비활성화
- 음성 인식은 브라우저 구현에 따라 외부 인식 서버를 사용할 수 있음을 개인정보 안내에 명시

### 4.4 AI 데일리 뉴스
- Netlify Function에서 RSS/Atom 피드를 가져와 같은 출처 형식으로 정규화
- Google 뉴스 AI 검색을 기본 피드로 사용하고 OpenAI, Google DeepMind, Anthropic, Hugging Face 공식 피드를 보조로 사용
- 최신순 정렬, 중복 제목 제거, 최대 18개
- 분류: 제품·서비스 / 연구 / 정책·산업
- 15분 브라우저 캐시, 30분 CDN 캐시, 실패 시 오류 상태 표시

## 5. 정보 구조

```text
사이드바
├─ 할 일 추가
├─ 관리함
├─ 오늘
├─ 다음 일정
├─ AI 데일리 뉴스
├─ 내 프로젝트
└─ AI 설정

메인
├─ 페이지 제목·날짜·완료율
├─ AI 빠른 정리 입력
├─ 할 일 목록·필터
└─ 직접 입력 폼
```

## 6. 디자인 방향
- Todoist의 강점인 넓은 여백, 차분한 사이드바, 한 줄 중심 작업 목록, 빠른 추가 흐름을 참고한다.
- Todoist 로고, 아이콘, 문구, 고유 그래픽은 복제하지 않는다.
- 브랜드 컬러는 따뜻한 적색 계열을 사용하되 독자적인 `오늘AI` 워드마크를 사용한다.
- 데스크톱은 고정 사이드바, 모바일은 슬라이드 메뉴를 사용한다.

## 7. 데이터 모델

### Task
```ts
interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;        // YYYY-MM-DD
  dueTime: string | null; // HH:mm
  priority: 1 | 2 | 3 | 4;
  project: string;
  labels: string[];
  completed: boolean;
  createdAt: string;
}
```

### NewsItem
```ts
interface NewsItem {
  title: string;
  link: string;
  description: string;
  publishedAt: string;
  source: string;
  category: "product" | "research" | "policy";
}
```

## 8. API 설계

### `POST /.netlify/functions/organize-task`
Headers:
- `Content-Type: application/json`
- `X-OpenAI-Key: sk-...` (사용자 입력 모드, 선택)

Body:
```json
{
  "text": "자연어 할 일",
  "today": "YYYY-MM-DD",
  "timezone": "Asia/Seoul",
  "knownProjects": ["개인", "학교", "업무"]
}
```

동작:
1. 헤더 키가 있으면 해당 키 사용
2. 없으면 Netlify `OPENAI_API_KEY` 환경변수 사용
3. OpenAI Responses API와 Structured Outputs로 스키마 강제
4. 키나 전체 API 응답을 로그에 남기지 않음

### `GET /.netlify/functions/ai-news`
Response:
```json
{
  "items": [],
  "updatedAt": "ISO-8601"
}
```

## 9. 보안 기준
- API 키를 HTML, JavaScript 상수, GitHub, `.env` 커밋에 넣지 않는다.
- 사용자 입력 키는 `sessionStorage`에만 저장하며 탭 종료 시 삭제한다.
- API 키는 HTTPS 요청의 헤더로 Function에 전달하고 서버 로그에 기록하지 않는다.
- 더 안전한 운영 모드는 Netlify 환경변수 `OPENAI_API_KEY` 사용이다.
- CSP, Referrer-Policy, Permissions-Policy 헤더를 설정한다.
- OpenAI 프로젝트별 키, 권한 제한, 사용 예산 한도를 권장한다.
- 공개 사용자에게 개인 키 입력을 요구하는 BYOK 방식은 피싱 오해와 키 탈취 위험이 있으므로 개인정보처리방침과 운영 주체를 분명히 표시해야 한다.

## 10. 비기능 요구사항
- Lighthouse 접근성 90점 이상 목표
- 모바일 320px 이상
- 핵심 화면 초기 로드 2초 이내 목표
- API 실패가 할 일 직접 입력 기능을 막지 않아야 함
- 뉴스 피드 한 곳이 실패해도 다른 피드 결과를 표시

## 11. 개발 로드맵

### 1단계 — 현재 MVP
- 정적 프론트
- localStorage
- OpenAI 자연어 구조화
- Web Speech API
- RSS 뉴스 집계
- Netlify 배포

### 2단계 — 계정과 동기화
- Supabase Auth/DB
- 기기 간 동기화
- 사용자별 프로젝트·환경설정
- Row Level Security

### 3단계 — 생산성 확장
- 반복 할 일
- 알림
- 캘린더 보기
- 드래그 정렬
- AI 일일 브리핑과 일정 재계획

### 4단계 — 운영 안정화
- 사용자별 API 사용량 제한
- 서버 소유 API 키 모드
- 감사 로그와 오류 모니터링
- 뉴스 요약 생성 및 출처 인용

## 12. Codex 작업 목록
- [ ] Playwright E2E 테스트 추가
- [ ] 할 일 편집 기능 추가
- [ ] 반복 일정 파서 및 데이터 모델 추가
- [ ] 뉴스 피드별 장애 메트릭 추가
- [ ] Supabase 마이그레이션 설계
- [ ] 개인정보처리방침·이용약관 페이지 추가
- [ ] PWA 설치와 오프라인 캐시 추가
