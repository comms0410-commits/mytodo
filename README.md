# 토토 데이보드

Motion의 우선순위 관리 느낌과 Momentum의 오늘 대시보드 느낌을 섞은 개인 업무관리 웹앱입니다.

## 주요 기능

- 오늘 할 일 보기
- 지연된 업무 보기
- 7일 안에 다가오는 업무 보기
- 전체 업무 관리
- 업무 추가, 완료, 삭제
- 서울 날씨 표시
- 오늘 뉴스 링크
- 업무 상황에 맞는 집중 음악 추천
- Netlify Functions 기반 AI 브리핑 옵션
- 모바일 반응형 UI
- localStorage 저장

## Netlify 업로드 방법

1. 이 폴더 전체를 GitHub 저장소에 업로드합니다.
2. Netlify에서 Add new site → Import an existing project를 선택합니다.
3. GitHub 저장소를 연결합니다.
4. Build command는 비워둡니다.
5. Publish directory는 `.` 으로 설정합니다.
6. Deploy site를 누릅니다.

## AI 브리핑 사용 방법

Netlify 환경변수에 `OPENAI_API_KEY`를 등록하면 AI 브리핑이 동작합니다.
환경변수가 없으면 브라우저 안의 규칙 기반 브리핑을 사용합니다.

## 다음 개발 단계

- Supabase 로그인 추가
- 업무 DB 저장
- 프로젝트별 필터
- 한 줄 입력 AI 분석
- 매일 아침 알림
- 구글 캘린더 연동
