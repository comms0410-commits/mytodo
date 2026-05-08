# 토토 데이보드 GPT Netlify 버전

이 버전은 사용자가 사이트 안에서 GPT에게 말하듯 업무를 입력하면, Netlify Function이 OpenAI API를 호출해 업무명, 프로젝트, 마감일, 중요도를 정리한 뒤 화면에 추가합니다.

## 중요 보안 안내

OpenAI API Key는 절대 index.html에 넣지 마세요.
Netlify 환경변수에만 저장해야 합니다.

이미 공개된 API Key는 OpenAI 대시보드에서 폐기하고 새 키를 발급하세요.

## Netlify 배포

1. 이 폴더를 GitHub 저장소에 업로드
2. Netlify → Add new site → Import an existing project
3. Build command: 비워두기
4. Publish directory: .
5. Deploy

## 환경변수 설정

Netlify 대시보드에서:

Site configuration → Environment variables → Add variable

Key:
OPENAI_API_KEY

Value:
새로 발급한 OpenAI API Key

그다음 Deploys에서 Redeploy를 실행하세요.

## 사용법

사이트에서 “GPT에게 말하듯 업무 추가” 입력칸에 다음처럼 입력합니다.

폴로AI 광고 영상 시나리오 목요일까지 중요도 높음으로 추가해줘

GPT가 자동으로 업무명, 관련항목, 마감일, 중요도를 정리해 업무 목록에 추가합니다.

## 저장 방식

업무 데이터는 현재 브라우저 localStorage에 저장됩니다.
다른 기기와 동기화하려면 다음 단계에서 Supabase DB를 붙여야 합니다.
