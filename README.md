# 오늘AI 플래너

Todoist의 간결한 작업 관리 흐름을 참고해 만든 한국어 일일 할 일 서비스입니다. 직접 입력, AI 자연어 정리, 브라우저 음성 입력, AI 데일리 뉴스를 제공합니다.

## 주요 기능
- 오늘 / 관리함 / 다음 일정 / 프로젝트별 할 일 보기
- 직접 입력, 완료, 삭제, 필터
- OpenAI Responses API Structured Outputs를 통한 자연어 할 일 구조화
- Web Speech API 기반 한국어 음성 입력
- RSS/Atom 기반 AI 뉴스 자동 업데이트
- 반응형 UI와 기본 접근성

## 파일 구조
```text
public/
  index.html
  styles.css
  app.js
netlify/functions/
  organize-task.mjs
  ai-news.mjs
docs/
  PRODUCT_SPEC.md
AGENTS.md
netlify.toml
```

## 로컬 실행
Netlify CLI가 설치되어 있다면:
```bash
npm install -g netlify-cli
netlify dev
```

정적 화면만 확인하려면 `public/`을 로컬 웹 서버로 열 수 있지만, AI와 뉴스 Function은 `netlify dev`가 필요합니다.

## API 키 방식
이 프로젝트는 두 가지 방식을 지원합니다.

### A. 사용자 직접 입력(BYOK)
- 화면의 **AI 설정**에서 사용자가 자신의 키를 입력
- 키는 `sessionStorage`에만 저장
- 탭을 닫으면 삭제
- 요청 때 `X-OpenAI-Key` 헤더로 Netlify Function에 전달
- GitHub와 정적 번들에는 포함되지 않음

주의: 브라우저에 입력된 키는 해당 기기의 사용자/확장 프로그램/악성 스크립트가 볼 가능성이 있습니다. 공용 컴퓨터에서는 사용하지 마세요.

### B. Netlify 환경변수(운영 권장)
Netlify → Site configuration → Environment variables에서 설정:
```text
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.4-mini
```
이 경우 화면에서 키를 입력하지 않아도 Function이 환경변수 키를 사용합니다. Function scope를 포함하고 다시 배포하세요.

## Netlify 배포
1. 이 GitHub 저장소를 Netlify에 연결
2. Build command: 비워 두기
3. Publish directory: `public`
4. Functions directory: `netlify/functions` (`netlify.toml`에 이미 설정됨)
5. Deploy site
6. 운영 권장 방식은 Netlify 환경변수 설정 후 재배포

## 보안 체크
- `.env`와 API 키를 커밋하지 않기
- 노출된 키는 즉시 폐기하고 새 키 발급
- OpenAI 프로젝트 키 권한과 사용 예산 제한 설정
- Function 로그에 키나 요청 헤더 출력 금지
- 공개 서비스 전 개인정보처리방침과 BYOK 안내 추가

## Codex
- 전체 기획: [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md)
- 저장소 작업 규칙: [`AGENTS.md`](AGENTS.md)

## 디자인 참고 범위
Todoist의 정보 구조와 빠른 입력 경험을 참고했지만, Todoist의 로고·브랜드 자산·고유 문구를 사용하지 않습니다. 이 프로젝트는 Todoist와 제휴 관계가 없습니다.
